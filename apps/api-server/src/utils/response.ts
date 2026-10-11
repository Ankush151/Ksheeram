import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '@ksheeraam/contracts';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
    requestId: (res.req.headers['x-request-id'] as string) || undefined,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  statusCode = 200
): void {
  const payload: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      items,
      pagination,
    },
    requestId: (res.req.headers['x-request-id'] as string) || undefined,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(payload);
}
