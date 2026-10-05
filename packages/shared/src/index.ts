import { z } from 'zod';

export type ClassStatus = 'Open' | 'Waitlist' | 'Closed';
export type EnrollmentStatus = 'Active' | 'Pending' | 'Waitlisted' | 'Cancelled';
export type TemplateStatus = 'Ready' | 'Draft';
export type UserRole = 'admin' | 'coach';

export interface SwimClass {
  id: string;
  name: string;
  program: string;
  coach: string;
  startAt: string;
  durationMinutes: number;
  capacity: number;
  enrolled: number;
  minimumAge: number;
  maximumAge: number;
  status: ClassStatus;
}
export interface Student { id: string; name: string; age: number; guardianName: string; mobile: string; classId: string; attendance: string; enrollmentStatus: EnrollmentStatus; }
export interface Enrollment { id: string; studentId: string; classId: string; status: EnrollmentStatus; createdAt: string; }
export interface AttendanceRecord { studentId: string; present: boolean; note?: string | undefined; }
export interface Attendance { id: string; classId: string; sessionDate: string; records: AttendanceRecord[]; updatedAt: string; }
export interface DashboardMetric { label: string; value: string; change: string; state: 'Healthy' | 'Growing' | 'On target' | 'Attention'; }
export interface MessageTemplate { id: string; name: string; audience: string; message: string; preview: string; status: TemplateStatus; }
export interface PublicUser { id: string; name: string; email: string; role: UserRole; }
export interface Session { token: string; expiresAt: string; user: PublicUser; }
export interface ApiErrorBody { error: { code: ErrorCode; message: string; details: unknown | null } }
export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR';

const id = z.string().trim().min(1).max(100);
const mobile = z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/);
export const studentInputSchema = z.object({ id: id.optional(), name: z.string().trim().min(2).max(100), age: z.number().int().min(3).max(100), guardianName: z.string().trim().min(2).max(100), mobile, classId: id, attendance: z.string().default('Not started'), enrollmentStatus: z.enum(['Active', 'Pending', 'Waitlisted', 'Cancelled']).default('Pending') });
export const enrollmentInputSchema = z.object({ student: z.object({ name: z.string().trim().min(2).max(100), age: z.number().int().min(3).max(100) }), guardian: z.object({ name: z.string().trim().min(2).max(100), mobile }), classId: id });
export const classInputSchema = z.object({ id: id.optional(), name: z.string().trim().min(2).max(100), program: z.string().trim().min(2).max(100), coach: z.string().trim().min(2).max(100), startAt: z.string().datetime(), durationMinutes: z.number().int().min(15).max(180), capacity: z.number().int().min(1).max(100), enrolled: z.number().int().min(0).default(0), minimumAge: z.number().int().min(3), maximumAge: z.number().int().max(100), status: z.enum(['Open', 'Waitlist', 'Closed']) }).refine((value) => value.maximumAge >= value.minimumAge, { message: 'Maximum age must not be below minimum age', path: ['maximumAge'] });
export const attendanceInputSchema = z.object({ classId: id, sessionDate: z.string().date(), records: z.array(z.object({ studentId: id, present: z.boolean(), note: z.string().max(250).optional() })).min(1) });
export const templateInputSchema = z.object({ id: id.optional(), name: z.string().trim().min(2).max(100), audience: z.string().trim().min(2).max(100), message: z.string().trim().min(5).max(1000), preview: z.string().max(1000).default(''), status: z.enum(['Ready', 'Draft']) });
export const whatsappLinkInputSchema = z.object({ templateId: id, recipientId: id, context: z.record(z.string().max(200)) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(10).max(128) });
export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(100) });

export type EnrollmentInput = z.infer<typeof enrollmentInputSchema>;
export type ClassInput = z.infer<typeof classInputSchema>;
export type StudentInput = z.infer<typeof studentInputSchema>;
export type AttendanceInput = z.infer<typeof attendanceInputSchema>;
export type TemplateInput = z.infer<typeof templateInputSchema>;
export type WhatsAppLinkInput = z.infer<typeof whatsappLinkInputSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
