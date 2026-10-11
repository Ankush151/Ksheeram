import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { AppError } from './utils/errors';

// Route imports
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { productsRouter } from './modules/products/products.routes';
import { suppliersRouter } from './modules/suppliers/suppliers.routes';
import { procurementRouter } from './modules/procurement/procurement.routes';
import { inventoryRouter } from './modules/inventory/inventory.routes';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { deliveryRouter } from './modules/delivery/delivery.routes';
import { billingRouter } from './modules/billing/billing.routes';
import { whatsAppRouter } from './modules/whatsapp/whatsapp.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { usersController } from './modules/users/users.controller';
import { billingController } from './modules/billing/billing.controller';
import { authenticate } from './middleware/auth';

export const app = express();

// Trust proxy for secure cookies behind reverse proxy
app.set('trust proxy', 1);

// 1. Request ID Middleware
app.use(requestIdMiddleware);

// 2. CORS configuration
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all dev origins cleanly
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-razorpay-signature'],
  })
);

// 3. Body and Cookie Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Rate Limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests created from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api/', apiLimiter);

// 5. Health and Readiness probes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'ksheeraam-api-server',
    version: '1.0.0',
  });
});

app.get('/ready', (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// 6. Mount modular monolith routes under /api/v1
const v1Router = express.Router();

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/products', productsRouter);
v1Router.use('/suppliers', suppliersRouter);
v1Router.use('/procurement', procurementRouter);
v1Router.use('/inventory', inventoryRouter);
v1Router.use('/subscriptions', subscriptionsRouter);
v1Router.use('/orders', ordersRouter);
v1Router.use('/delivery', deliveryRouter);
v1Router.use('/billing', billingRouter);
v1Router.use('/whatsapp', whatsAppRouter);
v1Router.use('/reports', reportsRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/admin', adminRouter);

// Customer web aliases for addresses, invoices, and payments
const addressesRouter = express.Router();
addressesRouter.use(authenticate);
addressesRouter.get('/', usersController.listAddresses);
addressesRouter.post('/', usersController.createAddress);
addressesRouter.put('/:id', usersController.updateAddress);
addressesRouter.delete('/:id', usersController.deleteAddress);
v1Router.use('/addresses', addressesRouter);

const invoicesRouter = express.Router();
invoicesRouter.use(authenticate);
invoicesRouter.get('/', billingController.listInvoices);
invoicesRouter.get('/:id', billingController.getInvoiceById);
v1Router.use('/invoices', invoicesRouter);

const paymentsRouter = express.Router();
paymentsRouter.use(authenticate);
paymentsRouter.get('/', billingController.listLedger);
paymentsRouter.post('/wallet-recharge', billingController.topupWallet);
v1Router.use('/payments', paymentsRouter);

app.use('/api/v1', v1Router);

// 7. 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
  });
});

// 8. Global Centralized Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      details: err.details,
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // MongoDB duplicate key error handling
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_KEY_ERROR',
      requestId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  console.error(`[Unhandled Error] [ReqID: ${requestId}]:`, err);

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error occurred.' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
    requestId,
    timestamp: new Date().toISOString(),
  });
});
