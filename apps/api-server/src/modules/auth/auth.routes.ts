import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@ksheeraam/contracts';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be a valid 10-digit number'),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role).optional(),
});

const loginSchema = z.object({
  phoneOrEmail: z.string().min(3, 'Phone or Email is required'),
  password: z.string().optional(),
  otp: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.post('/admin/login', validate({ body: loginSchema }), authController.login);
authRouter.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
