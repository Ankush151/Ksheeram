import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { PaymentMethod, PaymentStatus, Role } from '@ksheeraam/contracts';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/models/User';
import { PaymentModel, PrepaidLedgerEntryModel } from '../src/models/Billing';
import { billingService } from '../src/modules/billing/billing.service';
import { env } from '../src/config/env';

describe('Billing, Payments & Webhook Verification', () => {
  let customerId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectDatabase();
    const customer = await UserModel.create({
      name: 'Payment Tester',
      phone: `9555${Math.floor(100000 + Math.random() * 900000)}`,
      role: Role.CUSTOMER,
      walletBalancePaise: 0,
    });
    customerId = customer._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await UserModel.findByIdAndDelete(customerId);
    await PaymentModel.deleteMany({ customerId });
    await PrepaidLedgerEntryModel.deleteMany({ customerId });
    await disconnectDatabase();
  });

  it('credits user wallet balance and creates ledger entry upon topup', async () => {
    const { payment, newBalancePaise } = await billingService.topupWallet(
      customerId.toString(),
      50000, // ₹500.00
      PaymentMethod.UPI
    );

    expect(newBalancePaise).toBe(50000);
    expect(payment.amountPaise).toBe(50000);
    expect(payment.status).toBe(PaymentStatus.PAID);

    // Verify ledger entry
    const ledger = await PrepaidLedgerEntryModel.findOne({ customerId });
    expect(ledger).toBeTruthy();
    expect(ledger?.amountPaise).toBe(50000);
    expect(ledger?.balanceAfterPaise).toBe(50000);
    expect(ledger?.type).toBe('credit');
  });

  it('ensures topup idempotency when same idempotencyKey is re-submitted', async () => {
    const idempotencyKey = `topup_key_${Date.now()}`;

    // First attempt
    const res1 = await billingService.topupWallet(
      customerId.toString(),
      20000,
      PaymentMethod.UPI,
      idempotencyKey
    );
    expect(res1.newBalancePaise).toBe(70000); // 50000 + 20000

    // Duplicate retry attempt with same idempotencyKey
    const res2 = await billingService.topupWallet(
      customerId.toString(),
      20000,
      PaymentMethod.UPI,
      idempotencyKey
    );

    // Must return same payment and not double-credit wallet!
    expect(res2.payment.id).toBe(res1.payment.id);
    expect(res2.newBalancePaise).toBe(70000);

    const user = await UserModel.findById(customerId);
    expect(user?.walletBalancePaise).toBe(70000);
  });

  it('rejects webhooks with invalid HMAC SHA256 signature', async () => {
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_fraud_123',
            amount: 5000,
          },
        },
      },
    };

    await expect(
      billingService.processPaymentWebhook(JSON.stringify(payload), 'invalid_fake_signature_hash', payload)
    ).rejects.toThrow('Invalid payment gateway webhook signature');
  });

  it('verifies valid HMAC SHA256 webhook and idempotently records payment', async () => {
    const eventPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_valid_${Date.now()}`,
            amount: 8800,
            notes: { customerId: customerId.toString() },
          },
        },
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const validSignature = crypto
      .createHmac('sha256', env.WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const result = await billingService.processPaymentWebhook(rawBody, validSignature, eventPayload);
    expect(result.processed).toBe(true);
    expect(result.paymentNumber).toBeTruthy();

    // Re-sending same webhook (gateway retry) is safely idempotent
    const retryResult = await billingService.processPaymentWebhook(rawBody, validSignature, eventPayload);
    expect(retryResult.processed).toBe(true);
    expect(retryResult.paymentNumber).toBe(result.paymentNumber);
  });
});
