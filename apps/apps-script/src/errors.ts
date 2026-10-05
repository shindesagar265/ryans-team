import type { ErrorCode } from '@swimwave/shared';

export class AppError extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly status: number, public readonly details: unknown = null) { super(message); }
}
export class ValidationError extends AppError { constructor(message: string, details: unknown = null) { super('VALIDATION_ERROR', message, 422, details); } }
export class UnauthorizedError extends AppError { constructor(message = 'Authentication is required') { super('UNAUTHORIZED', message, 401); } }
export class NotFoundError extends AppError { constructor(message: string) { super('NOT_FOUND', message, 404); } }
export class ConflictError extends AppError { constructor(message: string) { super('CONFLICT', message, 409); } }

export function errorResponse(error: unknown): { status: number; body: { error: { code: ErrorCode; message: string; details: unknown } } } {
  if (error instanceof AppError) return { status: error.status, body: { error: { code: error.code, message: error.message, details: error.details } } };
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return { status: 500, body: { error: { code: 'INTERNAL_ERROR', message, details: null } } };
}
