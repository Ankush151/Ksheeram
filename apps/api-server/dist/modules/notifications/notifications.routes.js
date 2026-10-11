"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
const auth_1 = require("../../middleware/auth");
exports.notificationsRouter = (0, express_1.Router)();
exports.notificationsRouter.get('/', auth_1.authenticate, notifications_controller_1.notificationsController.list);
//# sourceMappingURL=notifications.routes.js.map