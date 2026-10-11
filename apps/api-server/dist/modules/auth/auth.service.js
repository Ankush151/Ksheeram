"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
exports.mapUserToDto = mapUserToDto;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const contracts_1 = require("@ksheeraam/contracts");
const User_1 = require("../../models/User");
const RefreshToken_1 = require("../../models/RefreshToken");
const env_1 = require("../../config/env");
const errors_1 = require("../../utils/errors");
function mapUserToDto(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        walletBalancePaise: user.walletBalancePaise,
        isActive: user.isActive,
        assignedRoute: user.assignedRoute,
        vehicleNumber: user.vehicleNumber,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
class AuthService {
    /**
     * Register a new user with password or mobile verification
     */
    async register(params, metadata) {
        const existing = await User_1.UserModel.findOne({ phone: params.phone });
        if (existing) {
            throw new errors_1.ConflictError('A user account with this phone number already exists.');
        }
        if (params.email) {
            const existingEmail = await User_1.UserModel.findOne({ email: params.email.toLowerCase() });
            if (existingEmail) {
                throw new errors_1.ConflictError('A user account with this email address already exists.');
            }
        }
        let passwordHash;
        if (params.password) {
            passwordHash = await bcryptjs_1.default.hash(params.password, 10);
        }
        const user = await User_1.UserModel.create({
            name: params.name,
            phone: params.phone,
            email: params.email?.toLowerCase(),
            passwordHash,
            role: params.role || contracts_1.Role.CUSTOMER,
            walletBalancePaise: 0,
            isActive: true,
        });
        const tokens = await this.generateTokenPair(user, metadata);
        return { user: mapUserToDto(user), ...tokens };
    }
    /**
     * Authenticate an existing user via password or OTP
     */
    async login(params, metadata) {
        const query = params.phoneOrEmail.includes('@')
            ? { email: params.phoneOrEmail.toLowerCase() }
            : { phone: params.phoneOrEmail };
        const user = await User_1.UserModel.findOne(query);
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid credentials. User not found.');
        }
        if (!user.isActive) {
            throw new errors_1.UnauthorizedError('This account has been deactivated. Please contact support.');
        }
        // Role check if requested by login form (e.g. admin login portal vs customer website)
        if (params.role && user.role !== params.role && user.role !== contracts_1.Role.ADMIN) {
            throw new errors_1.UnauthorizedError(`Account is not authorized for the '${params.role}' role portal.`);
        }
        // Password verification or OTP demo validation
        if (params.password && user.passwordHash) {
            const valid = await bcryptjs_1.default.compare(params.password, user.passwordHash);
            if (!valid) {
                throw new errors_1.UnauthorizedError('Invalid password credentials.');
            }
        }
        else if (params.otp) {
            // In development/demo, default OTP is 123456
            if (params.otp !== '123456') {
                throw new errors_1.UnauthorizedError('Invalid OTP code. Please enter valid verification code.');
            }
        }
        const tokens = await this.generateTokenPair(user, metadata);
        return { user: mapUserToDto(user), ...tokens };
    }
    /**
     * Fetch current authenticated user profile
     */
    async getMe(userId) {
        const user = await User_1.UserModel.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User profile not found.');
        }
        return mapUserToDto(user);
    }
    /**
     * Issue a short-lived access token
     */
    generateAccessToken(user, jti) {
        const payload = {
            id: user._id.toString(),
            role: user.role,
            phone: user.phone,
            email: user.email,
            name: user.name,
            type: 'access',
            jti: jti || crypto_1.default.randomUUID(),
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
    }
    /**
     * Issue a long-lived refresh token
     */
    generateRefreshToken(user, jti) {
        const payload = {
            id: user._id.toString(),
            type: 'refresh',
            jti,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
        });
    }
    /**
     * Issue a paired Access Token and Refresh Token with database session registration
     */
    async generateTokenPair(user, metadata) {
        const jti = crypto_1.default.randomUUID();
        const accessToken = this.generateAccessToken(user, jti);
        const refreshToken = this.generateRefreshToken(user, jti);
        // Refresh token expiry calculation (default 7 days)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await RefreshToken_1.RefreshTokenModel.create({
            userId: user._id,
            jti,
            token: refreshToken,
            expiresAt,
            userAgent: metadata?.userAgent,
            ipAddress: metadata?.ipAddress,
            isRevoked: false,
        });
        return {
            accessToken,
            refreshToken,
            token: accessToken, // backward compatibility
        };
    }
    /**
     * Refresh session tokens with automatic token rotation and reuse detection
     */
    async refreshTokens(refreshTokenStr, metadata) {
        if (!refreshTokenStr) {
            throw new errors_1.UnauthorizedError('Refresh token is required.');
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(refreshTokenStr, env_1.env.JWT_REFRESH_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new errors_1.UnauthorizedError('Refresh token has expired. Please log in again.');
            }
            throw new errors_1.UnauthorizedError('Invalid refresh token.');
        }
        if (!decoded || decoded.type !== 'refresh' || !decoded.jti || !decoded.id) {
            throw new errors_1.UnauthorizedError('Invalid token type provided for session refresh.');
        }
        // Lookup token in DB
        const tokenRecord = await RefreshToken_1.RefreshTokenModel.findOne({ jti: decoded.jti });
        if (!tokenRecord) {
            throw new errors_1.UnauthorizedError('Session does not exist or has already been expired.');
        }
        // Reuse detection: if a revoked refresh token is presented, suspect token theft
        if (tokenRecord.isRevoked) {
            // Invalidate all tokens for this user for security
            await RefreshToken_1.RefreshTokenModel.updateMany({ userId: decoded.id }, { isRevoked: true });
            throw new errors_1.UnauthorizedError('Revoked session reuse detected. For your security, all active sessions have been terminated. Please log in again.');
        }
        const user = await User_1.UserModel.findById(decoded.id);
        if (!user || !user.isActive) {
            throw new errors_1.UnauthorizedError('User account is inactive or no longer exists.');
        }
        // Token Rotation: invalidate previous refresh token, create new token pair
        const newJti = crypto_1.default.randomUUID();
        const newAccessToken = this.generateAccessToken(user, newJti);
        const newRefreshToken = this.generateRefreshToken(user, newJti);
        tokenRecord.isRevoked = true;
        tokenRecord.replacedByJti = newJti;
        await tokenRecord.save();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await RefreshToken_1.RefreshTokenModel.create({
            userId: user._id,
            jti: newJti,
            token: newRefreshToken,
            expiresAt,
            userAgent: metadata?.userAgent || tokenRecord.userAgent,
            ipAddress: metadata?.ipAddress || tokenRecord.ipAddress,
            isRevoked: false,
        });
        return {
            user: mapUserToDto(user),
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            token: newAccessToken,
        };
    }
    /**
     * Revoke a refresh token on logout
     */
    async revokeRefreshToken(refreshTokenStr) {
        if (!refreshTokenStr)
            return false;
        try {
            const decoded = jsonwebtoken_1.default.decode(refreshTokenStr);
            if (decoded?.jti) {
                await RefreshToken_1.RefreshTokenModel.updateOne({ jti: decoded.jti }, { isRevoked: true });
                return true;
            }
            await RefreshToken_1.RefreshTokenModel.updateOne({ token: refreshTokenStr }, { isRevoked: true });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Revoke all active sessions for a user (e.g. password reset or account security)
     */
    async revokeAllUserSessions(userId) {
        await RefreshToken_1.RefreshTokenModel.updateMany({ userId }, { isRevoked: true });
    }
    /**
     * Backward-compatible token generator for existing test suites
     */
    generateToken(user) {
        return this.generateAccessToken(user);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map