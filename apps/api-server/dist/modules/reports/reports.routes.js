"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const contracts_1 = require("@ksheeraam/contracts");
const reports_controller_1 = require("./reports.controller");
const auth_1 = require("../../middleware/auth");
exports.reportsRouter = (0, express_1.Router)();
exports.reportsRouter.get('/daily', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), reports_controller_1.reportsController.getDaily);
exports.reportsRouter.get('/dashboard', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), reports_controller_1.reportsController.getDashboardStats);
exports.reportsRouter.get('/dashboard/stats', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), reports_controller_1.reportsController.getDashboardStats);
exports.reportsRouter.get('/audit-logs', auth_1.authenticate, (0, auth_1.requireRoles)(contracts_1.Role.ADMIN), reports_controller_1.reportsController.listAuditLogs);
//# sourceMappingURL=reports.routes.js.map