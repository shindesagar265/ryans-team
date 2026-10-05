import { AuthService } from './AuthService';
import { PortalService } from './PortalService';

export interface Services { auth: AuthService; portal: PortalService; }
let services: Services | null = null;
export function initializeServices(): Services { services = { auth: new AuthService(), portal: new PortalService() }; return services; }
export function getServices(): Services { return services ?? initializeServices(); }
export function registerServices(overrides: Services | null): void { services = overrides; }
