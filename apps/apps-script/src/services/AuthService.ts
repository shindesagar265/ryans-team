import type { PublicUser, Session } from '@swimwave/shared';
import { ConflictError, UnauthorizedError } from '../errors';
import { getConfig } from '../config';
import { SheetsRepository, type Row } from '../repositories/SheetsRepository';

type UserRow = Row & { id: string; name: string; email: string; role: 'admin' | 'coach'; passwordHash: string; salt: string };
const HEADERS = ['id', 'name', 'email', 'role', 'passwordHash', 'salt'];

function base64Url(value: string | number[]): string {
  const bytes = typeof value === 'string' ? Utilities.newBlob(value).getBytes() : value;
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/u, '');
}
function sign(value: string, secret: string): string { return base64Url(Utilities.computeHmacSha256Signature(value, secret)); }
function slowHash(password: string, salt: string): string {
  let value = `${salt}:${password}`;
  for (let index = 0; index < 12_000; index += 1) value = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value));
  return value;
}
function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export class AuthService {
  constructor(private readonly repository = new SheetsRepository()) {}
  register(input: { name: string; email: string; password: string }): Session {
    const email = input.email.toLowerCase();
    if (this.repository.list<UserRow>('Users', HEADERS).some((user) => user.email === email)) throw new ConflictError('An account already exists for this email');
    const salt = Utilities.getUuid();
    const row: UserRow = { id: Utilities.getUuid(), name: input.name, email, role: 'coach', salt, passwordHash: slowHash(input.password, salt) };
    this.repository.upsert('Users', HEADERS, row);
    return this.createSession(row);
  }
  login(input: { email: string; password: string }): Session {
    const user = this.repository.list<UserRow>('Users', HEADERS).find((candidate) => candidate.email === input.email.toLowerCase());
    if (!user || !safeEqual(user.passwordHash, slowHash(input.password, user.salt))) throw new UnauthorizedError('Email or password is incorrect');
    return this.createSession(user);
  }
  authenticate(token: string): PublicUser {
    try {
      const [encodedPayload, signature] = token.split('.');
      if (!encodedPayload || !signature) throw new Error('Malformed token');
      const config = getConfig();
      if (!safeEqual(signature, sign(encodedPayload, config.signingSecret))) throw new Error('Invalid signature');
      const payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(encodedPayload)).getDataAsString()) as { sub: string; exp: number; iss: string; aud: string };
      if (payload.exp <= Math.floor(Date.now() / 1000) || payload.iss !== config.issuer || payload.aud !== config.audience) throw new Error('Expired or invalid token');
      const user = this.repository.find<UserRow>('Users', HEADERS, payload.sub);
      if (!user) throw new Error('Unknown user');
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    } catch { throw new UnauthorizedError('Session is invalid or expired'); }
  }
  private createSession(user: UserRow): Session {
    const config = getConfig();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = base64Url(JSON.stringify({ sub: user.id, exp, iss: config.issuer, aud: config.audience, alg: 'HS256' }));
    return { token: `${payload}.${sign(payload, config.signingSecret)}`, expiresAt: new Date(exp * 1000).toISOString(), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}
