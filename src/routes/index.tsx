
import { publicRoutes } from './public.routes';
import { authenticatedRoutes } from './authenticated.routes';
import { adminRoutes } from './admin.routes';

export const routes = [...publicRoutes, ...authenticatedRoutes, ...adminRoutes];
