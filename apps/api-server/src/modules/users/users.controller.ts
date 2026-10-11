import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess } from '../../utils/response';
import { Role } from '@ksheeraam/contracts';

export class UsersController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as Role | undefined;
      const users = await usersService.listUsers(role);
      sendSuccess(res, users, 200);
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = await usersService.getUserById(id);
      sendSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  }

  async listAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = req.params.userId ? String(req.params.userId) : req.user!.id;
      const addresses = await usersService.listUserAddresses(req.user!.id, targetUserId, req.user!.role);
      sendSuccess(res, addresses, 200);
    } catch (err) {
      next(err);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await usersService.createAddress(req.user!.id, req.body);
      sendSuccess(res, address, 201, 'Address added successfully.');
    } catch (err) {
      next(err);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const address = await usersService.updateAddress(id, req.user!.id, req.user!.role, req.body);
      sendSuccess(res, address, 200, 'Address updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      await usersService.deleteAddress(id, req.user!.id, req.user!.role);
      sendSuccess(res, { deleted: true }, 200, 'Address removed successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
