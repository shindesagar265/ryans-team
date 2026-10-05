import type { AttendanceInput, ClassInput, DashboardMetric, Enrollment, EnrollmentInput, MessageTemplate, PublicUser, RegisterInput, Session, Student, StudentInput, SwimClass, TemplateInput, WhatsAppLinkInput } from '@swimwave/shared';
import type { Program } from '../types';

export interface ApiClient {
  health(): Promise<{ status: string; services: Record<string, string> }>;
  listClasses(): Promise<SwimClass[]>;
  createEnrollment(input: EnrollmentInput): Promise<Enrollment>;
  getDashboard(): Promise<{ metrics: DashboardMetric[]; upcomingClasses: SwimClass[] }>;
  saveClass(input: ClassInput): Promise<SwimClass>;
  saveStudent(input: StudentInput): Promise<Student>;
  recordAttendance(input: AttendanceInput): Promise<{ id: string }>;
  listMessageTemplates(): Promise<MessageTemplate[]>;
  saveMessageTemplate(input: TemplateInput): Promise<MessageTemplate>;
  createWhatsAppLink(input: WhatsAppLinkInput): Promise<{ url: string; preview: string }>;
  listPrograms(): Promise<Program[]>;
  listStudents(): Promise<Student[]>;
  getCurrentUser(): Promise<PublicUser>;
  login(input: { email: string; password: string }): Promise<Session>;
  createAccount(input: RegisterInput): Promise<Session>;
  logout(): Promise<void>;
}
