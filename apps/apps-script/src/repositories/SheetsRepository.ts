import { getConfig } from '../config';

export type Row = Record<string, unknown>;
const JSON_PREFIX = '__json__:';

function encode(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return `${JSON_PREFIX}${JSON.stringify(value)}`;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}
function decode(value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith(JSON_PREFIX)) return JSON.parse(value.slice(JSON_PREFIX.length));
  return value;
}

export class SheetsRepository {
  private spreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet { return SpreadsheetApp.openById(getConfig().spreadsheetId); }
  ensureSheet(name: string, headers: string[]): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = this.spreadsheet();
    const sheet = spreadsheet.getSheetByName(name) ?? spreadsheet.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sheet.setFrozenRows(1);
      return sheet;
    }
    const actual = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]?.map(String) ?? [];
    const prefixLength = Math.min(actual.length, headers.length);
    for (let index = 0; index < prefixLength; index += 1) {
      if (actual[index] !== headers[index]) throw new Error(`Sheet ${name} has incompatible column ${index + 1}: expected ${headers[index]}, found ${actual[index]}`);
    }
    if (actual.length < headers.length) {
      const missing = headers.slice(actual.length);
      sheet.getRange(1, actual.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    }
    sheet.setFrozenRows(1);
    return sheet;
  }
  list<T extends Row>(name: string, headers: string[]): T[] {
    const sheet = this.ensureSheet(name, headers);
    if (sheet.getLastRow() < 2) return [];
    const values = sheet.getRange(1, 1, sheet.getLastRow(), headers.length).getValues();
    const actualHeaders = values[0]?.map(String) ?? headers;
    return values.slice(1).filter((row) => row.some((value) => value !== '')).map((row) => Object.fromEntries(actualHeaders.map((header, index) => [header, decode(row[index])])) as T);
  }
  find<T extends Row>(name: string, headers: string[], id: string): T | null { return this.list<T>(name, headers).find((row) => row.id === id) ?? null; }
  upsert<T extends Row>(name: string, headers: string[], record: T): T {
    const sheet = this.ensureSheet(name, headers);
    const rows = this.list<T>(name, headers);
    const index = rows.findIndex((row) => row.id === record.id);
    const values = headers.map((header) => encode(record[header]));
    if (index >= 0) sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]);
    else sheet.appendRow(values);
    return record;
  }
  transaction<T>(operation: () => T): T {
    const lock = LockService.getScriptLock();
    lock.waitLock(30_000);
    try { return operation(); } finally { lock.releaseLock(); }
  }
}
