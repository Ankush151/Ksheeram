import { Router } from 'express';
import { Role } from '@ksheeraam/contracts';
import { reportsController } from './reports.controller';
import { authenticate, requireRoles } from '../../middleware/auth';

export const reportsRouter = Router();

reportsRouter.get('/daily', authenticate, requireRoles(Role.ADMIN), reportsController.getDaily);
reportsRouter.get('/dashboard', authenticate, requireRoles(Role.ADMIN), reportsController.getDashboardStats);
reportsRouter.get('/dashboard/stats', authenticate, requireRoles(Role.ADMIN), reportsController.getDashboardStats);
reportsRouter.get('/audit-logs', authenticate, requireRoles(Role.ADMIN), reportsController.listAuditLogs);
