import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { Role } from '@ksheeraam/contracts';
import { app } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { RefreshTokenModel } from '../src/models/RefreshToken';
import { authService } from '../src/modules/auth/auth.service';

const request = supertest(app);

describe('Enterprise Scalable JWT Authentication Suite', () => {
  let testUser: any;
  const userPassword = 'TestPassword@123';

  beforeAll(async () => {
    await connectDatabase();

    testUser = await UserModel.create({
      name: 'JWT Scalable Test User',
      phone: `9999${Math.floor(100000 + Math.random() * 900000)}`,
      email: `jwttest_${Date.now()}@ksheeraam.com`,
      role: Role.CUSTOMER,
      passwordHash: await import('bcryptjs').then((b) => b.hash(userPassword, 10)),
      walletBalancePaise: 50000,
      isActive: true,
    });
  });

  afterAll(async () => {
    if (testUser) {
      await RefreshTokenModel.deleteMany({ userId: testUser._id });
      await UserModel.deleteOne({ _id: testUser._id });
    }
    await disconnectDatabase();
  });

  it('login issues both accessToken and refreshToken with dual cookies and payload', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      phoneOrEmail: testUser.phone,
      password: userPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.token).toBe(res.body.data.accessToken);

    // Verify Set-Cookie headers
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('ksheeraam_access_token'))).toBe(true);
    expect(cookies.some((c: string) => c.includes('ksheeraam_refresh_token'))).toBe(true);

    // Verify session was registered in MongoDB
    const sessionInDb = await RefreshTokenModel.findOne({ userId: testUser._id, isRevoked: false });
    expect(sessionInDb).toBeDefined();
  });

  it('rejects refresh token when mistakenly sent to access endpoint', async () => {
    const tokenPair = await authService.generateTokenPair(testUser);

    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenPair.refreshToken}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('successfully rotates tokens via /api/v1/auth/refresh and revokes previous refresh token', async () => {
    const initialTokens = await authService.generateTokenPair(testUser);

    // Call /refresh with the initial refresh token
    const refreshRes = await request
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(initialTokens.refreshToken);

    // Previous refresh token must now be revoked in DB
    const oldSession = await RefreshTokenModel.findOne({ token: initialTokens.refreshToken });
    expect(oldSession?.isRevoked).toBe(true);

    // The new access token should work on protected endpoint
    const meRes = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(testUser._id.toString());
  });

  it('detects revoked refresh token reuse and denies access with security warning', async () => {
    const initialTokens = await authService.generateTokenPair(testUser);

    // First refresh (normal rotation)
    await request
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken });

    // Attacker tries to reuse the old revoked refresh token
    const reuseRes = await request
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.message).toContain('Revoked session reuse detected');
  });

  it('logout revokes the refresh token and clears all cookies', async () => {
    const tokens = await authService.generateTokenPair(testUser);

    const logoutRes = await request
      .post('/api/v1/auth/logout')
      .send({ refreshToken: tokens.refreshToken });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.loggedOut).toBe(true);

    // Token record must be revoked
    const revokedSession = await RefreshTokenModel.findOne({ token: tokens.refreshToken });
    expect(revokedSession?.isRevoked).toBe(true);

    // Trying to refresh after logout must fail
    const refreshAfterLogout = await request
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });
});
