import { describe, expect, it } from 'vitest';
import { enrollmentInputSchema, classInputSchema } from './index';

describe('shared request schemas', () => {
  it('accepts a valid swimmer enrollment', () => {
    expect(enrollmentInputSchema.safeParse({ student: { name: 'Anaya Mehta', age: 8 }, guardian: { name: 'Priya Mehta', mobile: '+91 98200 31456' }, classId: 'stroke-b' }).success).toBe(true);
  });
  it('rejects an invalid class age range', () => {
    expect(classInputSchema.safeParse({ name: 'Test', program: 'Test', coach: 'Coach', startAt: '2026-10-10T09:00:00.000Z', durationMinutes: 30, capacity: 8, minimumAge: 10, maximumAge: 5, status: 'Open' }).success).toBe(false);
  });
});
