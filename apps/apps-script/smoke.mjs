import { spawn } from 'node:child_process';

const origin = 'http://127.0.0.1:8787';
const server = spawn(process.execPath, ['local-dev.mjs'], { cwd: import.meta.dirname, stdio: ['ignore', 'pipe', 'inherit'] });
server.stdout.on('data', (chunk) => process.stdout.write(chunk));

const waitForHealth = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${origin}/exec?action=health`);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Local Apps Script adapter did not become healthy');
};

const call = async (method, action, { body, token, expected = [200] } = {}) => {
  const url = new URL('/exec', origin);
  url.searchParams.set('action', action);
  if (method === 'GET' && token) url.searchParams.set('token', token);
  const response = await fetch(url, {
    method,
    ...(method === 'POST' ? { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...(body ?? {}), ...(token ? { token } : {}) }) } : {}),
  });
  const payload = await response.json();
  if (!expected.includes(response.status)) throw new Error(`${method} ${action} returned ${response.status}: ${JSON.stringify(payload)}`);
  console.log(`${method} ${action}: ${response.status}`);
  return payload;
};

try {
  await waitForHealth();
  await call('GET', 'health');
  await call('GET', 'classes');
  const registration = await call('POST', 'register', { body: { name: 'Local Administrator', email: 'admin@local.test', password: 'local-password-2026' }, expected: [201] });
  const token = registration.session.token;
  await call('POST', 'login', { body: { email: 'admin@local.test', password: 'local-password-2026' } });
  await call('GET', 'me', { token });
  await call('GET', 'dashboard', { token });
  await call('GET', 'students', { token });
  await call('GET', 'messageTemplates', { token });
  await call('POST', 'classes', { token, body: { class: { name: 'Integration Class', program: 'Integration', coach: 'Local Coach', startAt: '2026-10-10T09:00:00.000Z', durationMinutes: 45, capacity: 8, enrolled: 0, minimumAge: 4, maximumAge: 12, status: 'Open' } }, expected: [201] });
  await call('POST', 'students', { token, body: { student: { name: 'Integration Student', age: 8, guardianName: 'Integration Guardian', mobile: '+91 90000 00000', classId: 'class-1', attendance: 'Not started', enrollmentStatus: 'Pending' } }, expected: [201] });
  await call('POST', 'enrollments', { body: { student: { name: 'Enrollment Student', age: 9 }, guardian: { name: 'Enrollment Guardian', mobile: '+91 91111 11111' }, classId: 'class-1' }, expected: [201] });
  await call('POST', 'attendance', { token, body: { classId: 'class-1', sessionDate: '2026-10-10', records: [{ studentId: 'student-2', present: true }] } });
  await call('POST', 'messageTemplates', { token, body: { template: { name: 'Class Reminder', audience: 'Enrolled families', message: 'Your swimming class starts soon.', preview: '', status: 'Ready' } }, expected: [201] });
  await call('POST', 'whatsappLink', { token, body: { templateId: 'template-3', recipientId: 'student-2', context: {} } });
  await call('POST', 'logout', { token });
  console.log('All 15 API actions responded successfully.');
} finally {
  server.kill();
}
