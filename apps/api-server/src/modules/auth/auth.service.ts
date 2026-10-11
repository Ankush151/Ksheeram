import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, UserDto } from '@ksheeraam/contracts';
import { UserModel, IUser } from '../../models/User';
import { RefreshTokenModel } from '../../models/RefreshToken';
import { env } from '../../config/env';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors';

export function mapUserToDto(user: IUser): UserDto {
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

export interface JwtAccessPayload {
  id: string;
  role: Role;
  phone: string;
  email?: string;
  name?: string;
  type: 'access';
  jti: string;
}

export interface JwtRefreshPayload {
  id: string;
  type: 'refresh';
  jti: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  token: string; // for backward compatibility
}

export class AuthService {
  /**
   * Register a new user with password or mobile verification
   */
  async register(
    params: {
      name: string;
      phone: string;
      email?: string;
      password?: string;
      role?: Role;
    },
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: UserDto } & AuthTokens> {
    const existing = await UserModel.findOne({ phone: params.phone });
    if (existing) {
      throw new ConflictError('A user account with this phone number already exists.');
    }

    if (params.email) {
      const existingEmail = await UserModel.findOne({ email: params.email.toLowerCase() });
      if (existingEmail) {
        throw new ConflictError('A user account with this email address already exists.');
      }
    }

    let passwordHash: string | undefined;
    if (params.password) {
      passwordHash = await bcrypt.hash(params.password, 10);
    }

    const user = await UserModel.create({
      name: params.name,
      phone: params.phone,
      email: params.email?.toLowerCase(),
      passwordHash,
      role: params.role || Role.CUSTOMER,
      walletBalancePaise: 0,
      isActive: true,
    });

    const tokens = await this.generateTokenPair(user, metadata);
    return { user: mapUserToDto(user), ...tokens };
  }

  /**
   * Authenticate an existing user via password or OTP
   */
  async login(
    params: {
      phoneOrEmail: string;
      password?: string;
      otp?: string;
      role?: Role;
    },
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: UserDto } & AuthTokens> {
    const query = params.phoneOrEmail.includes('@')
      ? { email: params.phoneOrEmail.toLowerCase() }
      : { phone: params.phoneOrEmail };

    const user = await UserModel.findOne(query);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials. User not found.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('This account has been deactivated. Please contact support.');
    }

    // Role check if requested by login form (e.g. admin login portal vs customer website)
    if (params.role && user.role !== params.role && user.role !== Role.ADMIN) {
      throw new UnauthorizedError(`Account is not authorized for the '${params.role}' role portal.`);
    }

    // Password verification or OTP demo validation
    if (params.password && user.passwordHash) {
      const valid = await bcrypt.compare(params.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedError('Invalid password credentials.');
      }
    } else if (params.otp) {
      // In development/demo, default OTP is 123456
      if (params.otp !== '123456') {
        throw new UnauthorizedError('Invalid OTP code. Please enter valid verification code.');
      }
    }

    const tokens = await this.generateTokenPair(user, metadata);
    return { user: mapUserToDto(user), ...tokens };
  }

  /**
   * Fetch current authenticated user profile
   */
  async getMe(userId: string): Promise<UserDto> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found.');
    }
    return mapUserToDto(user);
  }

  /**
   * Issue a short-lived access token
   */
  generateAccessToken(user: IUser, jti?: string): string {
    const payload: JwtAccessPayload = {
      id: user._id.toString(),
      role: user.role,
      phone: user.phone,
      email: user.email,
      name: user.name,
      type: 'access',
      jti: jti || crypto.randomUUID(),
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Issue a long-lived refresh token
   */
  generateRefreshToken(user: IUser, jti: string): string {
    const payload: JwtRefreshPayload = {
      id: user._id.toString(),
      type: 'refresh',
      jti,
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
  }

  /**
   * Issue a paired Access Token and Refresh Token with database session registration
   */
  async generateTokenPair(
    user: IUser,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthTokens> {
    const jti = crypto.randomUUID();
    const accessToken = this.generateAccessToken(user, jti);
    const refreshToken = this.generateRefreshToken(user, jti);

    // Refresh token expiry calculation (default 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshTokenModel.create({
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
  async refreshTokens(
    refreshTokenStr: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<{ user: UserDto } & AuthTokens> {
    if (!refreshTokenStr) {
      throw new UnauthorizedError('Refresh token is required.');
    }

    let decoded: JwtRefreshPayload;
    try {
      decoded = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid refresh token.');
    }

    if (!decoded || decoded.type !== 'refresh' || !decoded.jti || !decoded.id) {
      throw new UnauthorizedError('Invalid token type provided for session refresh.');
    }

    // Lookup token in DB
    const tokenRecord = await RefreshTokenModel.findOne({ jti: decoded.jti });
    if (!tokenRecord) {
      throw new UnauthorizedError('Session does not exist or has already been expired.');
    }

    // Reuse detection: if a revoked refresh token is presented, suspect token theft
    if (tokenRecord.isRevoked) {
      // Invalidate all tokens for this user for security
      await RefreshTokenModel.updateMany({ userId: decoded.id }, { isRevoked: true });
      throw new UnauthorizedError(
        'Revoked session reuse detected. For your security, all active sessions have been terminated. Please log in again.'
      );
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is inactive or no longer exists.');
    }

    // Token Rotation: invalidate previous refresh token, create new token pair
    const newJti = crypto.randomUUID();
    const newAccessToken = this.generateAccessToken(user, newJti);
    const newRefreshToken = this.generateRefreshToken(user, newJti);

    tokenRecord.isRevoked = true;
    tokenRecord.replacedByJti = newJti;
    await tokenRecord.save();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshTokenModel.create({
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
  async revokeRefreshToken(refreshTokenStr: string): Promise<boolean> {
    if (!refreshTokenStr) return false;
    try {
      const decoded = jwt.decode(refreshTokenStr) as JwtRefreshPayload | null;
      if (decoded?.jti) {
        await RefreshTokenModel.updateOne({ jti: decoded.jti }, { isRevoked: true });
        return true;
      }
      await RefreshTokenModel.updateOne({ token: refreshTokenStr }, { isRevoked: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Revoke all active sessions for a user (e.g. password reset or account security)
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany({ userId }, { isRevoked: true });
  }

  /**
   * Backward-compatible token generator for existing test suites
   */
  generateToken(user: IUser): string {
    return this.generateAccessToken(user);
  }
}

export const authService = new AuthService();
