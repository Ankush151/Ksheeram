"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppService = exports.WhatsAppService = void 0;
exports.mapWARecordToDto = mapWARecordToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const WhatsApp_1 = require("../../models/WhatsApp");
const User_1 = require("../../models/User");
const orders_service_1 = require("../orders/orders.service");
const env_1 = require("../../config/env");
const errors_1 = require("../../utils/errors");
function mapWARecordToDto(rec) {
    return {
        id: rec._id.toString(),
        messageId: rec.messageId,
        senderPhone: rec.senderPhone,
        customerName: rec.customerName,
        customerId: rec.customerId?.toString(),
        rawMessage: rec.rawMessage,
        status: rec.status,
        handledBy: rec.handledBy?.toString(),
        convertedOrderId: rec.convertedOrderId?.toString(),
        receivedAt: rec.receivedAt.toISOString(),
    };
}
class WhatsAppService {
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === env_1.env.WHATSAPP_VERIFY_TOKEN) {
            return challenge || null;
        }
        return null;
    }
    async processInboundWebhook(data) {
        let processed = 0;
        let duplicates = 0;
        for (const entry of data.entry || []) {
            for (const change of entry.changes || []) {
                const val = change.value;
                const messages = val.messages || [];
                for (const msg of messages) {
                    const messageId = msg.id;
                    const fromPhone = msg.from;
                    const textBody = msg.text?.body?.trim() || '';
                    // Deduplication: check if messageId already processed
                    const existing = await WhatsApp_1.WhatsAppMessageRecordModel.findOne({ messageId });
                    if (existing) {
                        duplicates++;
                        continue;
                    }
                    // Customer identity resolution
                    const cleanPhone = fromPhone.replace(/\D/g, '').slice(-10);
                    const customer = await User_1.UserModel.findOne({
                        phone: { $regex: cleanPhone + '$' },
                    });
                    // Opt-out handling
                    if (textBody.toUpperCase() === 'STOP' || textBody.toUpperCase() === 'UNSUBSCRIBE') {
                        if (customer) {
                            customer.whatsappOptOut = true;
                            await customer.save();
                        }
                    }
                    // Detect intent
                    let detectedIntent = 'general_inquiry';
                    const lower = textBody.toLowerCase();
                    if (lower.includes('milk') || lower.includes('litre') || lower.includes('order') || lower.includes('bottle')) {
                        detectedIntent = 'order_request';
                    }
                    else if (lower.includes('pause') || lower.includes('stop delivery')) {
                        detectedIntent = 'pause_request';
                    }
                    await WhatsApp_1.WhatsAppMessageRecordModel.create({
                        messageId,
                        senderPhone: fromPhone,
                        customerName: customer ? customer.name : val.contacts?.[0]?.profile?.name || 'WhatsApp Customer',
                        customerId: customer?._id,
                        rawMessage: textBody,
                        status: contracts_1.WhatsAppMessageStatus.NEW,
                        detectedIntent,
                        receivedAt: new Date(),
                    });
                    processed++;
                }
            }
        }
        return { processed, duplicates };
    }
    async listMessages(status) {
        const query = {};
        if (status)
            query.status = status;
        const records = await WhatsApp_1.WhatsAppMessageRecordModel.find(query).sort({ receivedAt: -1 });
        return records.map(mapWARecordToDto);
    }
    /**
     * Admin-assisted ordering: Converts an inbound conversational WhatsApp request into a verified order
     * using the shared ordersService.
     */
    async convertToOrder(messageRecordId, adminUserId, orderParams) {
        const record = await WhatsApp_1.WhatsAppMessageRecordModel.findById(messageRecordId);
        if (!record)
            throw new errors_1.NotFoundError('WhatsApp message record not found.');
        if (record.status === contracts_1.WhatsAppMessageStatus.CONVERTED) {
            throw new errors_1.AppError('WhatsApp request has already been converted into an order.', 409, 'ALREADY_CONVERTED');
        }
        const targetUserId = record.customerId ? record.customerId.toString() : adminUserId;
        // Utilize the exact same order service as web checkout
        const createdOrder = await orders_service_1.ordersService.createOneTimeOrder(targetUserId, {
            ...orderParams,
            instructions: `WhatsApp order assisted from message: "${record.rawMessage}"`,
        });
        record.status = contracts_1.WhatsAppMessageStatus.CONVERTED;
        record.handledBy = new mongoose_1.default.Types.ObjectId(adminUserId);
        record.convertedOrderId = new mongoose_1.default.Types.ObjectId(createdOrder.id);
        record.processedAt = new Date();
        await record.save();
        return {
            message: mapWARecordToDto(record),
            order: createdOrder,
        };
    }
    async dismissMessage(messageRecordId, adminUserId) {
        const record = await WhatsApp_1.WhatsAppMessageRecordModel.findById(messageRecordId);
        if (!record)
            throw new errors_1.NotFoundError('WhatsApp message record not found.');
        record.status = contracts_1.WhatsAppMessageStatus.DISMISSED;
        record.handledBy = new mongoose_1.default.Types.ObjectId(adminUserId);
        record.processedAt = new Date();
        await record.save();
        return mapWARecordToDto(record);
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsAppService = new WhatsAppService();
//# sourceMappingURL=whatsapp.service.js.map