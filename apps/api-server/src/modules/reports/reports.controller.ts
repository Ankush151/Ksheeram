import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { sendSuccess } from '../../utils/response';
import { getKolkataDateString } from '@ksheeraam/contracts';

export class ReportsController {
  async getDaily(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.query.date) {
        const report = await reportsService.getDailyReport(req.query.date as string);
        sendSuccess(res, report, 200);
      } else {
        const reports = await reportsService.getRecentDailyReports();
        sendSuccess(res, reports, 200);
      }
    } catch (err) {
      next(err);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await reportsService.getDashboardStats();
      sendSuccess(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const logs = await reportsService.listAuditLogs(limit);
      sendSuccess(res, logs, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
