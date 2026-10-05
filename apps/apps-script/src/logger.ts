export function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, context: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...context }));
}
