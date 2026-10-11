"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsAppController = exports.WhatsAppController = void 0;
const whatsapp_service_1 = require("./whatsapp.service");
const response_1 = require("../../utils/response");
const WhatsApp_1 = require("../../models/WhatsApp");
const errors_1 = require("../../utils/errors");
class WhatsAppController {
    // Official Meta GET webhook verification endpoint
    verify(req, res) {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const verifiedChallenge = whatsapp_service_1.whatsAppService.verifyWebhook(mode, token, challenge);
        if (verifiedChallenge) {
            res.status(200).send(verifiedChallenge);
        }
        else {
            res.status(403).send('Verification failed');
        }
    }
    // Official Meta POST inbound message webhook endpoint
    async handleInbound(req, res, next) {
        try {
            const result = await whatsapp_service_1.whatsAppService.processInboundWebhook(req.body);
            res.status(200).json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    async list(req, res, next) {
        try {
            const status = req.query.status;
            const messages = await whatsapp_service_1.whatsAppService.listMessages(status);
            (0, response_1.sendSuccess)(res, messages, 200);
        }
        catch (err) {
            next(err);
        }
    }
    async updateStatus(req, res, next) {
        try {
            const id = String(req.params.id);
            const { status } = req.body;
            const msg = await WhatsApp_1.WhatsAppMessageRecordModel.findById(id);
            if (!msg)
                throw new errors_1.NotFoundError('WhatsApp message not found.');
            msg.status = status;
            await msg.save();
            (0, response_1.sendSuccess)(res, (0, whatsapp_service_1.mapWARecordToDto)(msg), 200, 'WhatsApp request status updated.');
        }
        catch (err) {
            next(err);
        }
    }
    async convertToOrder(req, res, next) {
        try {
            const id = String(req.params.id);
            const result = await whatsapp_service_1.whatsAppService.convertToOrder(id, req.user.id, req.body);
            (0, response_1.sendSuccess)(res, result, 200, 'WhatsApp message converted to order.');
        }
        catch (err) {
            next(err);
        }
    }
    async dismiss(req, res, next) {
        try {
            const id = String(req.params.id);
            const result = await whatsapp_service_1.whatsAppService.dismissMessage(id, req.user.id);
            (0, response_1.sendSuccess)(res, result, 200, 'WhatsApp message dismissed.');
        }
        catch (err) {
            next(err);
        }
    }
}
exports.WhatsAppController = WhatsAppController;
exports.whatsAppController = new WhatsAppController();
//# sourceMappingURL=whatsapp.controller.js.map