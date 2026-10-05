export interface AppConfig { spreadsheetId: string; signingSecret: string; issuer: string; audience: string; }

export function getConfig(): AppConfig {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID')?.trim() ?? '';
  const signingSecret = properties.getProperty('AUTH_SIGNING_SECRET')?.trim() ?? '';
  if (!spreadsheetId) throw new Error('SPREADSHEET_ID script property is required');
  if (signingSecret.length < 32) throw new Error('AUTH_SIGNING_SECRET must contain at least 32 characters');
  return {
    spreadsheetId,
    signingSecret,
    issuer: properties.getProperty('AUTH_ISSUER') ?? 'swimwave-apps-script',
    audience: properties.getProperty('AUTH_AUDIENCE') ?? 'swimwave-portal',
  };
}
