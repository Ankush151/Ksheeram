"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = exports.ReportsController = void 0;
const reports_service_1 = require("./reports.service");
const response_1 = require("../../utils/response");
class ReportsController {
    async getDaily(req, res, next) {
        try {
            if (req.query.date) {
                const report = await reports_service_1.reportsService.getDailyReport(req.query.date);
                (0, response_1.sendSuccess)(res, report, 200);
            }
            else {
                const reports = await reports_service_1.reportsService.getRecentDailyReports();
                (0, response_1.sendSuccess)(res, reports, 200);
            }
        }
        catch (err) {
            next(err);
        }
    }
    async getDashboardStats(req, res, next) {
        try {
            const stats = await reports_service_1.reportsService.getDashboardStats();
            (0, response_1.sendSuccess)(res, stats, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async listAuditLogs(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
            const logs = await reports_service_1.reportsService.listAuditLogs(limit);
            (0, response_1.sendSuccess)(res, logs, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ReportsController = ReportsController;
exports.reportsController = new ReportsController();
//# sourceMappingURL=reports.controller.js.map