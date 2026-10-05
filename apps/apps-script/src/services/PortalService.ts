import type { Attendance, DashboardMetric, Enrollment, MessageTemplate, Student, SwimClass } from '@swimwave/shared';
import { ConflictError, NotFoundError } from '../errors';
import { SheetsRepository, type Row } from '../repositories/SheetsRepository';
import { SheetMigrationService } from './SheetMigrationService';

export const SHEETS = {
  classes: { name: 'Classes', headers: ['id', 'name', 'program', 'coach', 'startAt', 'durationMinutes', 'capacity', 'enrolled', 'minimumAge', 'maximumAge', 'status'] },
  students: { name: 'Students', headers: ['id', 'name', 'age', 'guardianName', 'mobile', 'classId', 'attendance', 'enrollmentStatus'] },
  enrollments: { name: 'Enrollments', headers: ['id', 'studentId', 'classId', 'status', 'createdAt'] },
  attendance: { name: 'Attendance', headers: ['id', 'classId', 'sessionDate', 'records', 'updatedAt'] },
  templates: { name: 'MessageTemplates', headers: ['id', 'name', 'audience', 'message', 'preview', 'status'] },
} as const;

export class PortalService {
  constructor(private readonly repository = new SheetsRepository()) {}
  initialize(): void { new SheetMigrationService(this.repository).apply(); }
  health(): { status: 'healthy'; services: { googleSheets: 'ready' } } { this.repository.ensureSheet(SHEETS.classes.name, [...SHEETS.classes.headers]); return { status: 'healthy', services: { googleSheets: 'ready' } }; }
  listClasses(): SwimClass[] { return this.repository.list<SwimClass & Row>(SHEETS.classes.name, [...SHEETS.classes.headers]); }
  saveClass(input: Omit<SwimClass, 'id'> & { id?: string | undefined }): { value: SwimClass; created: boolean } {
    const created = !input.id;
    const value: SwimClass = { ...input, id: input.id ?? Utilities.getUuid() };
    if (value.enrolled > value.capacity) throw new ConflictError('Enrollment cannot exceed class capacity');
    this.repository.upsert(SHEETS.classes.name, [...SHEETS.classes.headers], value as SwimClass & Row);
    return { value, created };
  }
  saveStudent(input: Omit<Student, 'id'> & { id?: string | undefined }): { value: Student; created: boolean } {
    const created = !input.id;
    if (!this.repository.find(SHEETS.classes.name, [...SHEETS.classes.headers], input.classId)) throw new NotFoundError('Class not found');
    const value: Student = { ...input, id: input.id ?? Utilities.getUuid() };
    this.repository.upsert(SHEETS.students.name, [...SHEETS.students.headers], value as Student & Row);
    return { value, created };
  }
  enroll(input: { student: { name: string; age: number; guardianName: string; mobile: string; classId: string } }): Enrollment {
    return this.repository.transaction(() => {
      const swimClass = this.repository.find<SwimClass & Row>(SHEETS.classes.name, [...SHEETS.classes.headers], input.student.classId);
      if (!swimClass) throw new NotFoundError('Class not found');
      const students = this.repository.list<Student & Row>(SHEETS.students.name, [...SHEETS.students.headers]);
      if (students.some((student) => student.mobile === input.student.mobile && student.classId === input.student.classId && student.name.toLowerCase() === input.student.name.toLowerCase())) throw new ConflictError('This swimmer already has an enrollment request for the class');
      const isWaitlisted = swimClass.enrolled >= swimClass.capacity;
      const student: Student = { ...input.student, id: Utilities.getUuid(), attendance: 'Not started', enrollmentStatus: isWaitlisted ? 'Waitlisted' : 'Pending' };
      const enrollment: Enrollment = { id: Utilities.getUuid(), studentId: student.id, classId: swimClass.id, status: student.enrollmentStatus, createdAt: new Date().toISOString() };
      this.repository.upsert(SHEETS.students.name, [...SHEETS.students.headers], student as Student & Row);
      this.repository.upsert(SHEETS.enrollments.name, [...SHEETS.enrollments.headers], enrollment as Enrollment & Row);
      this.repository.upsert(SHEETS.classes.name, [...SHEETS.classes.headers], { ...swimClass, enrolled: isWaitlisted ? swimClass.enrolled : swimClass.enrolled + 1, status: isWaitlisted || swimClass.enrolled + 1 >= swimClass.capacity ? 'Waitlist' : swimClass.status } as SwimClass & Row);
      return enrollment;
    });
  }
  dashboard(): { metrics: DashboardMetric[]; upcomingClasses: SwimClass[] } {
    const classes = this.listClasses();
    const students = this.repository.list<Student & Row>(SHEETS.students.name, [...SHEETS.students.headers]);
    const active = students.filter((student) => student.enrollmentStatus === 'Active').length;
    const openPlaces = classes.reduce((sum, item) => sum + Math.max(0, item.capacity - item.enrolled), 0);
    return { metrics: [
      { label: 'Active Students', value: String(active), change: 'Current roster', state: 'Healthy' },
      { label: 'Weekly Enrollments', value: String(students.filter((student) => student.enrollmentStatus === 'Pending').length), change: 'Pending review', state: 'Growing' },
      { label: 'Average Attendance', value: this.attendanceRate(), change: 'Recorded sessions', state: 'On target' },
      { label: 'Open Places', value: String(openPlaces), change: `${classes.filter((item) => item.capacity - item.enrolled <= 3).length} classes nearly full`, state: 'Attention' },
    ], upcomingClasses: classes.filter((item) => new Date(item.startAt).getTime() >= Date.now()).sort((a, b) => a.startAt.localeCompare(b.startAt)).slice(0, 6) };
  }
  listStudents(): Student[] { return this.repository.list<Student & Row>(SHEETS.students.name, [...SHEETS.students.headers]); }
  recordAttendance(input: { classId: string; sessionDate: string; records: Attendance['records'] }): Attendance {
    if (!this.repository.find(SHEETS.classes.name, [...SHEETS.classes.headers], input.classId)) throw new NotFoundError('Class not found');
    const attendance: Attendance = { id: `${input.classId}-${input.sessionDate}`, ...input, updatedAt: new Date().toISOString() };
    return this.repository.upsert(SHEETS.attendance.name, [...SHEETS.attendance.headers], attendance as Attendance & Row) as Attendance & Row;
  }
  listTemplates(): MessageTemplate[] { return this.repository.list<MessageTemplate & Row>(SHEETS.templates.name, [...SHEETS.templates.headers]); }
  saveTemplate(input: Omit<MessageTemplate, 'id'> & { id?: string | undefined }): { value: MessageTemplate; created: boolean } { const created = !input.id; const value = { ...input, id: input.id ?? Utilities.getUuid() }; this.repository.upsert(SHEETS.templates.name, [...SHEETS.templates.headers], value as MessageTemplate & Row); return { value, created }; }
  whatsappLink(input: { templateId: string; recipientId: string; context: Record<string, string> }): { url: string; preview: string } {
    const template = this.repository.find<MessageTemplate & Row>(SHEETS.templates.name, [...SHEETS.templates.headers], input.templateId);
    const student = this.repository.find<Student & Row>(SHEETS.students.name, [...SHEETS.students.headers], input.recipientId);
    if (!template || !student) throw new NotFoundError('Template or recipient not found');
    const context: Record<string, string> = { guardian: student.guardianName, student: student.name, ...input.context };
    const preview = template.message.replace(/\{\{(\w+)\}\}/gu, (_match, key: string) => context[key] ?? `{{${key}}}`);
    const phone = student.mobile.replace(/\D/gu, '');
    return { url: `https://wa.me/${phone}?text=${encodeURIComponent(preview)}`, preview };
  }
  private attendanceRate(): string { const rows = this.repository.list<Attendance & Row>(SHEETS.attendance.name, [...SHEETS.attendance.headers]); const records = rows.flatMap((row) => row.records); return records.length ? `${Math.round(records.filter((record) => record.present).length / records.length * 100)}%` : '—'; }
}
