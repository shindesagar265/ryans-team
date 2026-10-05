import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Services } from '../src/services/registry';
import { registerServices } from '../src/services/registry';
import { dispatch } from '../src/Code';

const portal = {
  health: vi.fn(() => ({ status: 'healthy' as const, services: { googleSheets: 'ready' as const } })),
  listClasses: vi.fn(() => []),
};
const auth = { authenticate: vi.fn(() => ({ id: 'user-1', name: 'Maya', email: 'maya@example.com', role: 'admin' as const })) };

beforeEach(() => { vi.clearAllMocks(); registerServices({ portal, auth } as unknown as Services); });

describe('API dispatch', () => {
  it('exposes health without authentication', () => {
    const result = dispatch({ method: 'GET', action: 'health' });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: 'healthy', services: { googleSheets: 'ready' } });
  });

  it('rejects protected actions without a token', () => {
    const result = dispatch({ method: 'GET', action: 'dashboard' });
    expect(result.status).toBe(401);
    expect(result.body).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('returns validation details for malformed enrollment', () => {
    const result = dispatch({ method: 'POST', action: 'enrollments', body: { student: {} } });
    expect(result.status).toBe(422);
    expect(result.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('returns a standardized error for unknown actions', () => {
    const result = dispatch({ method: 'GET', action: 'missing' });
    expect(result.status).toBe(401);
  });
});
