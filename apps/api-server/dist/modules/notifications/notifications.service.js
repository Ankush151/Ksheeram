"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsService = exports.NotificationsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Notification_1 = require("../../models/Notification");
class NotificationsService {
    async listUserNotifications(userId) {
        return Notification_1.NotificationModel.find({ userId: new mongoose_1.default.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(30);
    }
    async sendNotification(params) {
        return Notification_1.NotificationModel.create({
            userId: new mongoose_1.default.Types.ObjectId(params.userId),
            channel: params.channel || 'whatsapp',
            title: params.title,
            body: params.body,
            sent: true,
            status: 'sent',
            metadata: params.metadata,
        });
    }
}
exports.NotificationsService = NotificationsService;
exports.notificationsService = new NotificationsService();
//# sourceMappingURL=notifications.service.js.map