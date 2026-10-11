import { describe, it, expect } from 'vitest';
import {
  SubscriptionFrequency,
  SubscriptionStatus,
  getKolkataDateString,
  getKolkataDayOfWeek,
  isValidDateKey,
} from '@ksheeraam/contracts';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service';
import { ISubscription } from '../src/models/Subscription';

describe('Subscription Schedule & Kolkata Timezone Calculations', () => {
  const service = new SubscriptionsService();

  it('validates canonical Kolkata date strings', () => {
    expect(isValidDateKey('2026-10-15')).toBe(true);
    expect(isValidDateKey('2026-1-1')).toBe(false);
    expect(isValidDateKey('15-10-2026')).toBe(false);
  });

  it('computes correct day of week in Asia/Kolkata timezone', () => {
    // 2026-10-11 is a Sunday
    const sunday = new Date('2026-10-11T12:00:00Z');
    expect(getKolkataDayOfWeek(sunday)).toBe(0);

    // 2026-10-12 is a Monday
    const monday = new Date('2026-10-12T12:00:00Z');
    expect(getKolkataDayOfWeek(monday)).toBe(1);
  });

  it('identifies eligible delivery days for daily subscriptions', () => {
    const dailySub = {
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.DAILY,
      startDate: '2026-10-01',
    } as ISubscription;

    expect(service.isEligibleDeliveryDate(dailySub, '2026-10-01')).toBe(true);
    expect(service.isEligibleDeliveryDate(dailySub, '2026-10-02')).toBe(true);
    expect(service.isEligibleDeliveryDate(dailySub, '2026-09-30')).toBe(false); // Before start date
  });

  it('identifies eligible delivery days for alternate-day subscriptions', () => {
    const alternateSub = {
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.ALTERNATE,
      startDate: '2026-10-01',
    } as ISubscription;

    expect(service.isEligibleDeliveryDate(alternateSub, '2026-10-01')).toBe(true); // Day 0
    expect(service.isEligibleDeliveryDate(alternateSub, '2026-10-02')).toBe(false); // Day 1
    expect(service.isEligibleDeliveryDate(alternateSub, '2026-10-03')).toBe(true); // Day 2
    expect(service.isEligibleDeliveryDate(alternateSub, '2026-10-04')).toBe(false); // Day 3
  });

  it('identifies eligible delivery days for custom weekly schedules', () => {
    // Custom: Monday (1), Wednesday (3), Friday (5)
    const customSub = {
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.CUSTOM,
      customDays: [1, 3, 5],
      startDate: '2026-10-01',
    } as ISubscription;

    // 2026-10-12 is Monday (1)
    expect(service.isEligibleDeliveryDate(customSub, '2026-10-12')).toBe(true);
    // 2026-10-13 is Tuesday (2)
    expect(service.isEligibleDeliveryDate(customSub, '2026-10-13')).toBe(false);
    // 2026-10-14 is Wednesday (3)
    expect(service.isEligibleDeliveryDate(customSub, '2026-10-14')).toBe(true);
    // 2026-10-15 is Thursday (4)
    expect(service.isEligibleDeliveryDate(customSub, '2026-10-15')).toBe(false);
    // 2026-10-16 is Friday (5)
    expect(service.isEligibleDeliveryDate(customSub, '2026-10-16')).toBe(true);
  });

  it('respects subscription pause windows', () => {
    const pausedSub = {
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.DAILY,
      startDate: '2026-10-01',
      pauseStartDate: '2026-10-10',
      pauseEndDate: '2026-10-14',
    } as ISubscription;

    expect(service.isEligibleDeliveryDate(pausedSub, '2026-10-09')).toBe(true);
    expect(service.isEligibleDeliveryDate(pausedSub, '2026-10-10')).toBe(false); // In pause window
    expect(service.isEligibleDeliveryDate(pausedSub, '2026-10-12')).toBe(false); // In pause window
    expect(service.isEligibleDeliveryDate(pausedSub, '2026-10-14')).toBe(false); // Last day of pause
    expect(service.isEligibleDeliveryDate(pausedSub, '2026-10-15')).toBe(true); // Resumed!
  });

  it('finds the next eligible delivery date after a pause window', () => {
    const sub = {
      status: SubscriptionStatus.ACTIVE,
      frequency: SubscriptionFrequency.DAILY,
      startDate: '2026-10-01',
      pauseStartDate: '2026-10-10',
      pauseEndDate: '2026-10-14',
    } as ISubscription;

    const nextDate = service.findNextEligibleDeliveryDate(sub, '2026-10-10');
    expect(nextDate).toBe('2026-10-15');
  });
});
