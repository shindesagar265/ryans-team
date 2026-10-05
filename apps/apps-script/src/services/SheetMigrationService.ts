import { SheetsRepository } from '../repositories/SheetsRepository';

export const SHEET_SCHEMAS = [
  { name: 'Classes', headers: ['id', 'name', 'program', 'coach', 'startAt', 'durationMinutes', 'capacity', 'enrolled', 'minimumAge', 'maximumAge', 'status'] },
  { name: 'Students', headers: ['id', 'name', 'age', 'guardianName', 'mobile', 'classId', 'attendance', 'enrollmentStatus'] },
  { name: 'Enrollments', headers: ['id', 'studentId', 'classId', 'status', 'createdAt'] },
  { name: 'Attendance', headers: ['id', 'classId', 'sessionDate', 'records', 'updatedAt'] },
  { name: 'MessageTemplates', headers: ['id', 'name', 'audience', 'message', 'preview', 'status'] },
  { name: 'Users', headers: ['id', 'name', 'email', 'role', 'passwordHash', 'salt'] },
] as const;

const VERSION_PROPERTY = 'SHEET_SCHEMA_VERSION';
const CURRENT_VERSION = 1;

export class SheetMigrationService {
  constructor(private readonly repository = new SheetsRepository()) {}

  apply(): number {
    const properties = PropertiesService.getScriptProperties();
    const installedVersion = Number(properties.getProperty(VERSION_PROPERTY) ?? '0');
    if (!Number.isInteger(installedVersion) || installedVersion < 0 || installedVersion > CURRENT_VERSION) {
      throw new Error(`Unsupported Google Sheets schema version: ${installedVersion}`);
    }
    if (installedVersion < 1) {
      for (const schema of SHEET_SCHEMAS) this.repository.ensureSheet(schema.name, [...schema.headers]);
      properties.setProperty(VERSION_PROPERTY, '1');
    }
    return CURRENT_VERSION;
  }
}
