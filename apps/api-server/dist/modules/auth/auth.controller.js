"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../utils/response");
const env_1 = require("../../config/env");
const COOKIE_ACCESS_NAME = 'ksheeraam_access_token';
const COOKIE_LEGACY_NAME = 'ksheeraam_token';
const COOKIE_REFRESH_NAME = 'ksheeraam_refresh_token';
// Access token cookie options
const accessCookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
// Refresh token cookie options (7 days)
const refreshCookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie(COOKIE_ACCESS_NAME, accessToken, accessCookieOptions);
    res.cookie(COOKIE_LEGACY_NAME, accessToken, accessCookieOptions);
    res.cookie(COOKIE_REFRESH_NAME, refreshToken, refreshCookieOptions);
}
function clearAuthCookies(res) {
    const clearOpts = {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    };
    res.clearCookie(COOKIE_ACCESS_NAME, clearOpts);
    res.clearCookie(COOKIE_LEGACY_NAME, clearOpts);
    res.clearCookie(COOKIE_REFRESH_NAME, clearOpts);
}
class AuthController {
    register = async (req, res, next) => {
        try {
            const metadata = {
                userAgent: req.headers['user-agent'],
                ipAddress: req.headers['x-forwarded-for'] || req.ip,
            };
            const result = await auth_service_1.authService.register(req.body, metadata);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            (0, response_1.sendSuccess)(res, {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                token: result.accessToken, // backward compatibility
            }, 201, 'Registration successful.');
        }
        catch (err) {
            next(err);
        }
    };
    login = async (req, res, next) => {
        try {
            const metadata = {
                userAgent: req.headers['user-agent'],
                ipAddress: req.headers['x-forwarded-for'] || req.ip,
            };
            const result = await auth_service_1.authService.login(req.body, metadata);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            (0, response_1.sendSuccess)(res, {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                token: result.accessToken, // backward compatibility
            }, 200, 'Login successful.');
        }
        catch (err) {
            next(err);
        }
    };
    refresh = async (req, res, next) => {
        try {
            // Extract refresh token from HTTP-only cookie, request body, or header
            let refreshToken = req.cookies?.[COOKIE_REFRESH_NAME] ||
                req.body?.refreshToken ||
                req.headers['x-refresh-token'];
            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token required for session renewal.',
                    code: 'REFRESH_TOKEN_REQUIRED',
                    requestId: req.headers['x-request-id'],
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            const metadata = {
                userAgent: req.headers['user-agent'],
                ipAddress: req.headers['x-forwarded-for'] || req.ip,
            };
            const result = await auth_service_1.authService.refreshTokens(refreshToken, metadata);
            setAuthCookies(res, result.accessToken, result.refreshToken);
            (0, response_1.sendSuccess)(res, {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                token: result.accessToken,
            }, 200, 'Session refreshed successfully.');
        }
        catch (err) {
            next(err);
        }
    };
    logout = async (req, res, next) => {
        try {
            const refreshToken = req.cookies?.[COOKIE_REFRESH_NAME] ||
                req.body?.refreshToken ||
                req.headers['x-refresh-token'];
            if (refreshToken) {
                await auth_service_1.authService.revokeRefreshToken(refreshToken);
            }
            clearAuthCookies(res);
            (0, response_1.sendSuccess)(res, { loggedOut: true }, 200, 'Logged out successfully.');
        }
        catch (err) {
            next(err);
        }
    };
    me = async (req, res, next) => {
        try {
            const user = await auth_service_1.authService.getMe(req.user.id);
            (0, response_1.sendSuccess)(res, user, 200);
        }
        catch (err) {
            next(err);
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map