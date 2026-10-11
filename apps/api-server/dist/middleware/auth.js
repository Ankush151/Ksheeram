"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRoles = requireRoles;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Extracts and verifies JWT from HTTP-only cookie `ksheeraam_token`
 * or `Authorization: Bearer <token>` header.
 */
function authenticate(req, res, next) {
    let token;
    // 1. Authorization: Bearer <token> header (API / mobile / frontend client priority)
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
    }
    // 2. HTTP-only access cookie or legacy cookie fallback
    if (!token && req.cookies) {
        token = req.cookies.ksheeraam_access_token || req.cookies.ksheeraam_token;
    }
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. No session token found.',
            code: 'UNAUTHENTICATED',
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString(),
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        // Guard: Prevent refresh tokens from being accepted as access tokens
        if (decoded.type && decoded.type !== 'access') {
            res.status(401).json({
                success: false,
                message: 'Invalid token type. Access token expected.',
                code: 'TOKEN_INVALID',
                requestId: req.headers['x-request-id'],
                timestamp: new Date().toISOString(),
            });
            return;
        }
        req.user = {
            id: decoded.id,
            role: decoded.role,
            phone: decoded.phone,
            email: decoded.email,
            name: decoded.name,
        };
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Access session token expired. Please refresh your session.',
                code: 'TOKEN_EXPIRED',
                requestId: req.headers['x-request-id'],
                timestamp: new Date().toISOString(),
            });
            return;
        }
        res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication session token.',
            code: 'TOKEN_INVALID',
            requestId: req.headers['x-request-id'],
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Role-Based Access Control Guard
 */
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
                code: 'UNAUTHENTICATED',
                requestId: req.headers['x-request-id'],
                timestamp: new Date().toISOString(),
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`,
                code: 'FORBIDDEN',
                requestId: req.headers['x-request-id'],
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map