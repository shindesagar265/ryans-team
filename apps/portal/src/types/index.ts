export type {
	DashboardMetric as Metric,
	EnrollmentInput,
	MessageTemplate,
	PublicUser as User,
	RegisterInput as AccountInput,
	Session,
	Student,
	SwimClass,
} from '@swimwave/shared';

export interface Program { name: string; ages: string; format: string; availability: string; description: string; image: string; }
