import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';

const COOKIE_ACCESS_NAME = 'ksheeraam_access_token';
const COOKIE_LEGACY_NAME = 'ksheeraam_token';
const COOKIE_REFRESH_NAME = 'ksheeraam_refresh_token';

// Access token cookie options
const accessCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Refresh token cookie options (7 days)
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(COOKIE_ACCESS_NAME, accessToken, accessCookieOptions);
  res.cookie(COOKIE_LEGACY_NAME, accessToken, accessCookieOptions);
  res.cookie(COOKIE_REFRESH_NAME, refreshToken, refreshCookieOptions);
}

function clearAuthCookies(res: Response): void {
  const clearOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  res.clearCookie(COOKIE_ACCESS_NAME, clearOpts);
  res.clearCookie(COOKIE_LEGACY_NAME, clearOpts);
  res.clearCookie(COOKIE_REFRESH_NAME, clearOpts);
}

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metadata = {
        userAgent: req.headers['user-agent'] as string | undefined,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
      };

      const result = await authService.register(req.body, metadata);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          token: result.accessToken, // backward compatibility
        },
        201,
        'Registration successful.'
      );
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metadata = {
        userAgent: req.headers['user-agent'] as string | undefined,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
      };

      const result = await authService.login(req.body, metadata);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          token: result.accessToken, // backward compatibility
        },
        200,
        'Login successful.'
      );
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract refresh token from HTTP-only cookie, request body, or header
      let refreshToken =
        req.cookies?.[COOKIE_REFRESH_NAME] ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

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
        userAgent: req.headers['user-agent'] as string | undefined,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip,
      };

      const result = await authService.refreshTokens(refreshToken, metadata);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          token: result.accessToken,
        },
        200,
        'Session refreshed successfully.'
      );
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken =
        req.cookies?.[COOKIE_REFRESH_NAME] ||
        req.body?.refreshToken ||
        (req.headers['x-refresh-token'] as string);

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      clearAuthCookies(res);
      sendSuccess(res, { loggedOut: true }, 200, 'Logged out successfully.');
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
