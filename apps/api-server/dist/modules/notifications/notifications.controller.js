"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsController = exports.NotificationsController = void 0;
const notifications_service_1 = require("./notifications.service");
const response_1 = require("../../utils/response");
class NotificationsController {
    async list(req, res, next) {
        try {
            const items = await notifications_service_1.notificationsService.listUserNotifications(req.user.id);
            (0, response_1.sendSuccess)(res, items, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationsController = NotificationsController;
exports.notificationsController = new NotificationsController();
//# sourceMappingURL=notifications.controller.js.map