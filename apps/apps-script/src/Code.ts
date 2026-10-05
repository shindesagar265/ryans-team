import { attendanceInputSchema, classInputSchema, enrollmentInputSchema, loginSchema, registerSchema, studentInputSchema, templateInputSchema, whatsappLinkInputSchema } from '@swimwave/shared';
import { errorResponse, UnauthorizedError, ValidationError } from './errors';
import { log } from './logger';
import { getServices } from './services/registry';

export interface ApiRequest { method: 'GET' | 'POST'; action: string; token?: string; body?: unknown; }
export interface ApiResult { status: number; body: unknown; }
const publicActions = new Set(['health', 'classes', 'enrollments', 'login', 'register']);

function parse<T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false; error: { flatten(): unknown } } }, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ValidationError('Request validation failed', result.error.flatten());
  return result.data;
}

export function dispatch(request: ApiRequest): ApiResult {
  const started = Date.now();
  try {
    const { portal, auth } = getServices();
    if (!publicActions.has(request.action)) {
      if (!request.token) throw new UnauthorizedError();
      auth.authenticate(request.token);
    }
    let result: ApiResult;
    if (request.method === 'GET' && request.action === 'health') result = { status: 200, body: portal.health() };
    else if (request.method === 'GET' && request.action === 'classes') result = { status: 200, body: { classes: portal.listClasses(), updatedAt: new Date().toISOString() } };
    else if (request.method === 'GET' && request.action === 'dashboard') result = { status: 200, body: portal.dashboard() };
    else if (request.method === 'GET' && request.action === 'students') result = { status: 200, body: { students: portal.listStudents() } };
    else if (request.method === 'GET' && request.action === 'messageTemplates') result = { status: 200, body: { templates: portal.listTemplates() } };
    else if (request.method === 'GET' && request.action === 'me') result = { status: 200, body: { user: auth.authenticate(request.token ?? '') } };
    else if (request.method === 'POST' && request.action === 'register') result = { status: 201, body: { session: auth.register(parse(registerSchema, request.body)) } };
    else if (request.method === 'POST' && request.action === 'login') result = { status: 200, body: { session: auth.login(parse(loginSchema, request.body)) } };
    else if (request.method === 'POST' && request.action === 'logout') result = { status: 200, body: { success: true } };
    else if (request.method === 'POST' && request.action === 'enrollments') {
      const input = parse(enrollmentInputSchema, request.body);
      result = { status: 201, body: { enrollment: portal.enroll({ student: { ...input.student, guardianName: input.guardian.name, mobile: input.guardian.mobile, classId: input.classId } }) } };
    } else if (request.method === 'POST' && request.action === 'classes') { const saved = portal.saveClass(parse(classInputSchema, (request.body as { class?: unknown })?.class)); result = { status: saved.created ? 201 : 200, body: { class: saved.value } }; }
    else if (request.method === 'POST' && request.action === 'students') { const saved = portal.saveStudent(parse(studentInputSchema, (request.body as { student?: unknown })?.student)); result = { status: saved.created ? 201 : 200, body: { student: saved.value } }; }
      else if (request.method === 'POST' && request.action === 'attendance') result = { status: 200, body: { attendance: portal.recordAttendance(parse(attendanceInputSchema, request.body)) } };
    else if (request.method === 'POST' && request.action === 'messageTemplates') { const saved = portal.saveTemplate(parse(templateInputSchema, (request.body as { template?: unknown })?.template)); result = { status: saved.created ? 201 : 200, body: { template: saved.value } }; }
    else if (request.method === 'POST' && request.action === 'whatsappLink') result = { status: 200, body: portal.whatsappLink(parse(whatsappLinkInputSchema, request.body)) };
    else result = { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Unknown API action', details: null } } };
    log('INFO', 'api.request', { method: request.method, action: request.action, status: result.status, durationMs: Date.now() - started });
    return result;
  } catch (error) {
    const result = errorResponse(error);
    log('ERROR', 'api.request.failed', { method: request.method, action: request.action, status: result.status, durationMs: Date.now() - started, error: result.body.error.code });
    return result;
  }
}

function output(result: ApiResult): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(result.body)).setMimeType(ContentService.MimeType.JSON);
}
export function doGet(event: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput {
  return output(dispatch({ method: 'GET', action: event.parameter.action ?? '', ...(event.parameter.token ? { token: event.parameter.token } : {}) }));
}
export function doPost(event: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let body: unknown = {};
  try { body = JSON.parse(event.postData?.contents ?? '{}'); } catch { return output({ status: 422, body: { error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON', details: null } } }); }
  const envelope = body as { token?: string };
  return output(dispatch({ method: 'POST', action: event.parameter.action ?? '', body, ...(envelope.token ? { token: envelope.token } : {}), ...(event.parameter.token ? { token: event.parameter.token } : {}) }));
}
export function setupSpreadsheet(): void { getServices().portal.initialize(); }
