import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import mongoose from 'mongoose';
import { Role } from '@ksheeraam/contracts';
import { app } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { authService } from '../src/modules/auth/auth.service';

const request = supertest(app);

describe('Authentication & Role-Based Access Control (RBAC)', () => {
  let customerUser: any;
  let customerToken: string;

  let otherCustomerUser: any;
  let otherCustomerToken: string;

  let deliveryAgentUser: any;
  let deliveryAgentToken: string;

  let adminUser: any;
  let adminToken: string;

  beforeAll(async () => {
    await connectDatabase();

    customerUser = await UserModel.create({
      name: 'Customer One',
      phone: `9111${Math.floor(100000 + Math.random() * 900000)}`,
      role: Role.CUSTOMER,
      walletBalancePaise: 10000,
    });
    customerToken = authService.generateToken(customerUser);

    otherCustomerUser = await UserModel.create({
      name: 'Customer Two',
      phone: `9222${Math.floor(100000 + Math.random() * 900000)}`,
      role: Role.CUSTOMER,
      walletBalancePaise: 5000,
    });
    otherCustomerToken = authService.generateToken(otherCustomerUser);

    deliveryAgentUser = await UserModel.create({
      name: 'Delivery Agent Ramu',
      phone: `9333${Math.floor(100000 + Math.random() * 900000)}`,
      role: Role.DELIVERY_AGENT,
      assignedRoute: 'Indiranagar',
    });
    deliveryAgentToken = authService.generateToken(deliveryAgentUser);

    adminUser = await UserModel.create({
      name: 'Admin Boss',
      phone: `9444${Math.floor(100000 + Math.random() * 900000)}`,
      role: Role.ADMIN,
    });
    adminToken = authService.generateToken(adminUser);
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      _id: { $in: [customerUser._id, otherCustomerUser._id, deliveryAgentUser._id, adminUser._id] },
    });
    await disconnectDatabase();
  });

  it('unauthenticated request to protected endpoint returns 401 UNAUTHENTICATED', async () => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('customer can access their own /me profile', async () => {
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(customerUser._id.toString());
    expect(res.body.data.role).toBe(Role.CUSTOMER);
  });

  it('customer cannot access admin-only users list (returns 403 FORBIDDEN)', async () => {
    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('admin can access admin-only users list (returns 200 OK)', async () => {
    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('customer cannot access another customer addresses', async () => {
    const res = await request
      .get(`/api/v1/users/${otherCustomerUser._id}/addresses`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('delivery agent can access delivery manifest but cannot access admin suppliers', async () => {
    // Delivery manifest is allowed for delivery agents
    const manifestRes = await request
      .get('/api/v1/delivery/manifest')
      .set('Authorization', `Bearer ${deliveryAgentToken}`);
    expect(manifestRes.status).toBe(200);

    // Suppliers route is admin-only
    const suppliersRes = await request
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${deliveryAgentToken}`);
    expect(suppliersRes.status).toBe(403);
  });
});
