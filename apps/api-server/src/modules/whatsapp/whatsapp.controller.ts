import { Request, Response, NextFunction } from 'express';
import { whatsAppService, mapWARecordToDto } from './whatsapp.service';
import { sendSuccess } from '../../utils/response';
import { WhatsAppMessageStatus } from '@ksheeraam/contracts';
import { WhatsAppMessageRecordModel } from '../../models/WhatsApp';
import { NotFoundError } from '../../utils/errors';

export class WhatsAppController {
  // Official Meta GET webhook verification endpoint
  verify(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    const verifiedChallenge = whatsAppService.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      res.status(200).send(verifiedChallenge);
    } else {
      res.status(403).send('Verification failed');
    }
  }

  // Official Meta POST inbound message webhook endpoint
  async handleInbound(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await whatsAppService.processInboundWebhook(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as WhatsAppMessageStatus | undefined;
      const messages = await whatsAppService.listMessages(status);
      sendSuccess(res, messages, 200);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;
      const msg = await WhatsAppMessageRecordModel.findById(id);
      if (!msg) throw new NotFoundError('WhatsApp message not found.');
      msg.status = status;
      await msg.save();
      sendSuccess(res, mapWARecordToDto(msg), 200, 'WhatsApp request status updated.');
    } catch (err) {
      next(err);
    }
  }

  async convertToOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await whatsAppService.convertToOrder(
        id,
        req.user!.id,
        req.body
      );
      sendSuccess(res, result, 200, 'WhatsApp message converted to order.');
    } catch (err) {
      next(err);
    }
  }

  async dismiss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const result = await whatsAppService.dismissMessage(id, req.user!.id);
      sendSuccess(res, result, 200, 'WhatsApp message dismissed.');
    } catch (err) {
      next(err);
    }
  }
}

export const whatsAppController = new WhatsAppController();
