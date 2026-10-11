import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}
