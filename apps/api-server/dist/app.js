"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const requestId_1 = require("./middleware/requestId");
const errors_1 = require("./utils/errors");
// Route imports
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const products_routes_1 = require("./modules/products/products.routes");
const suppliers_routes_1 = require("./modules/suppliers/suppliers.routes");
const procurement_routes_1 = require("./modules/procurement/procurement.routes");
const inventory_routes_1 = require("./modules/inventory/inventory.routes");
const subscriptions_routes_1 = require("./modules/subscriptions/subscriptions.routes");
const orders_routes_1 = require("./modules/orders/orders.routes");
const delivery_routes_1 = require("./modules/delivery/delivery.routes");
const billing_routes_1 = require("./modules/billing/billing.routes");
const whatsapp_routes_1 = require("./modules/whatsapp/whatsapp.routes");
const reports_routes_1 = require("./modules/reports/reports.routes");
const notifications_routes_1 = require("./modules/notifications/notifications.routes");
const admin_routes_1 = require("./modules/admin/admin.routes");
const users_controller_1 = require("./modules/users/users.controller");
const billing_controller_1 = require("./modules/billing/billing.controller");
const auth_1 = require("./middleware/auth");
exports.app = (0, express_1.default)();
// Trust proxy for secure cookies behind reverse proxy
exports.app.set('trust proxy', 1);
// 1. Request ID Middleware
exports.app.use(requestId_1.requestIdMiddleware);
// 2. CORS configuration
const allowedOrigins = env_1.env.CORS_ORIGIN.split(',').map((o) => o.trim());
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all dev origins cleanly
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'x-razorpay-signature'],
}));
// 3. Body and Cookie Parsers
exports.app.use(express_1.default.json({ limit: '5mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
// 4. Rate Limiter for API endpoints
const apiLimiter = (0, express_rate_limit_1.default)({
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
exports.app.use('/api/', apiLimiter);
// 5. Health and Readiness probes
exports.app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        service: 'ksheeraam-api-server',
        version: '1.0.0',
    });
});
exports.app.get('/ready', (req, res) => {
    const isDbConnected = mongoose_1.default.connection.readyState === 1;
    if (isDbConnected) {
        res.status(200).json({
            status: 'ready',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    }
    else {
        res.status(503).json({
            status: 'not_ready',
            database: 'disconnected',
            timestamp: new Date().toISOString(),
        });
    }
});
// 6. Mount modular monolith routes under /api/v1
const v1Router = express_1.default.Router();
v1Router.use('/auth', auth_routes_1.authRouter);
v1Router.use('/users', users_routes_1.usersRouter);
v1Router.use('/products', products_routes_1.productsRouter);
v1Router.use('/suppliers', suppliers_routes_1.suppliersRouter);
v1Router.use('/procurement', procurement_routes_1.procurementRouter);
v1Router.use('/inventory', inventory_routes_1.inventoryRouter);
v1Router.use('/subscriptions', subscriptions_routes_1.subscriptionsRouter);
v1Router.use('/orders', orders_routes_1.ordersRouter);
v1Router.use('/delivery', delivery_routes_1.deliveryRouter);
v1Router.use('/billing', billing_routes_1.billingRouter);
v1Router.use('/whatsapp', whatsapp_routes_1.whatsAppRouter);
v1Router.use('/reports', reports_routes_1.reportsRouter);
v1Router.use('/notifications', notifications_routes_1.notificationsRouter);
v1Router.use('/admin', admin_routes_1.adminRouter);
// Customer web aliases for addresses, invoices, and payments
const addressesRouter = express_1.default.Router();
addressesRouter.use(auth_1.authenticate);
addressesRouter.get('/', users_controller_1.usersController.listAddresses);
addressesRouter.post('/', users_controller_1.usersController.createAddress);
addressesRouter.put('/:id', users_controller_1.usersController.updateAddress);
addressesRouter.delete('/:id', users_controller_1.usersController.deleteAddress);
v1Router.use('/addresses', addressesRouter);
const invoicesRouter = express_1.default.Router();
invoicesRouter.use(auth_1.authenticate);
invoicesRouter.get('/', billing_controller_1.billingController.listInvoices);
invoicesRouter.get('/:id', billing_controller_1.billingController.getInvoiceById);
v1Router.use('/invoices', invoicesRouter);
const paymentsRouter = express_1.default.Router();
paymentsRouter.use(auth_1.authenticate);
paymentsRouter.get('/', billing_controller_1.billingController.listLedger);
paymentsRouter.post('/wallet-recharge', billing_controller_1.billingController.topupWallet);
v1Router.use('/payments', paymentsRouter);
exports.app.use('/api/v1', v1Router);
// 7. 404 Route Handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot ${req.method} ${req.originalUrl}`,
        code: 'ROUTE_NOT_FOUND',
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
    });
});
// 8. Global Centralized Error Handler
exports.app.use((err, req, res, _next) => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    if (err instanceof errors_1.AppError) {
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
        message: env_1.env.NODE_ENV === 'production' ? 'Internal server error occurred.' : err.message,
        code: 'INTERNAL_SERVER_ERROR',
        requestId,
        timestamp: new Date().toISOString(),
    });
});
//# sourceMappingURL=app.js.map