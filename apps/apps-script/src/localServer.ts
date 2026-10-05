import { createServer } from 'node:http';
import type {
  Attendance,
  AttendanceInput,
  ClassInput,
  DashboardMetric,
  Enrollment,
  MessageTemplate,
  PublicUser,
  Session,
  Student,
  StudentInput,
  SwimClass,
  TemplateInput,
  WhatsAppLinkInput,
} from '@swimwave/shared';
import { dispatch, type ApiRequest } from './Code';
import type { Services } from './services/registry';
import { registerServices } from './services/registry';

const port = Number(process.env.PORT ?? 8787);
const user: PublicUser = { id: 'local-user', name: 'Local Administrator', email: 'admin@local.test', role: 'admin' };
const classes: SwimClass[] = [];
const students: Student[] = [];
const templates: MessageTemplate[] = [];
const attendance: Attendance[] = [];
let sequence = 0;
const id = (prefix: string): string => `${prefix}-${++sequence}`;

const localPortal = {
  initialize: (): void => undefined,
  health: () => ({ status: 'healthy' as const, services: { googleSheets: 'ready' as const } }),
  listClasses: (): SwimClass[] => classes,
  listStudents: (): Student[] => students,
  listTemplates: (): MessageTemplate[] => templates,
  dashboard: (): { metrics: DashboardMetric[]; upcomingClasses: SwimClass[] } => ({ metrics: [], upcomingClasses: classes }),
  enroll: (input: { student: { name: string; age: number; guardianName: string; mobile: string; classId: string } }): Enrollment => {
    const studentId = id('student');
    students.push({ ...input.student, id: studentId, attendance: 'Not started', enrollmentStatus: 'Pending' });
    return { id: id('enrollment'), studentId, classId: input.student.classId, status: 'Pending', createdAt: new Date().toISOString() };
  },
  saveClass: (input: ClassInput): { value: SwimClass; created: boolean } => {
    const created = !input.id;
    const value: SwimClass = { ...input, id: input.id ?? id('class') };
    const index = classes.findIndex((item) => item.id === value.id);
    if (index >= 0) classes[index] = value; else classes.push(value);
    return { value, created };
  },
  saveStudent: (input: StudentInput): { value: Student; created: boolean } => {
    const created = !input.id;
    const value: Student = { ...input, id: input.id ?? id('student') };
    const index = students.findIndex((item) => item.id === value.id);
    if (index >= 0) students[index] = value; else students.push(value);
    return { value, created };
  },
  recordAttendance: (input: AttendanceInput): Attendance => {
    const value: Attendance = { ...input, id: `${input.classId}-${input.sessionDate}`, updatedAt: new Date().toISOString() };
    attendance.push(value);
    return value;
  },
  saveTemplate: (input: TemplateInput): { value: MessageTemplate; created: boolean } => {
    const created = !input.id;
    const value: MessageTemplate = { ...input, id: input.id ?? id('template') };
    const index = templates.findIndex((item) => item.id === value.id);
    if (index >= 0) templates[index] = value; else templates.push(value);
    return { value, created };
  },
  whatsappLink: (_input: WhatsAppLinkInput): { url: string; preview: string } => ({ url: 'https://wa.me/', preview: '' }),
};

const localAuth = {
  authenticate: (token: string): PublicUser => {
    if (token !== 'local-session') throw new Error('Invalid local session');
    return user;
  },
  register: (): Session => ({ token: 'local-session', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), user }),
  login: (): Session => ({ token: 'local-session', expiresAt: new Date(Date.now() + 3_600_000).toISOString(), user }),
};

registerServices({ portal: localPortal, auth: localAuth } as unknown as Services);

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `localhost:${port}`}`);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Access-Control-Allow-Origin', '*');
  if (url.pathname !== '/exec') {
    response.statusCode = 404;
    response.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Use /exec?action=...', details: null } }));
    return;
  }

  const chunks: Buffer[] = [];
  request.on('data', (chunk: Buffer) => chunks.push(chunk));
  request.on('end', () => {
    let body: unknown = undefined;
    try {
      if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      response.statusCode = 422;
      response.end(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON', details: null } }));
      return;
    }
    const envelope = typeof body === 'object' && body !== null ? body as { token?: string } : {};
    const method: ApiRequest['method'] = request.method === 'POST' ? 'POST' : 'GET';
    const token = url.searchParams.get('token') ?? envelope.token;
    const result = dispatch({ method, action: url.searchParams.get('action') ?? '', body, ...(token ? { token } : {}) });
    response.statusCode = result.status;
    response.end(JSON.stringify(result.body));
  });
});

server.listen(port, '127.0.0.1', () => console.log(`SwimWave local Apps Script adapter listening at http://127.0.0.1:${port}/exec`));
