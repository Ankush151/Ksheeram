import mongoose from 'mongoose';
import {
  CreateSubscriptionDto,
  PackageSize,
  PauseSubscriptionDto,
  Role,
  SubscriptionDto,
  SubscriptionFrequency,
  SubscriptionStatus,
  UpdateSubscriptionScheduleDto,
  getKolkataDateString,
  getKolkataDayOfWeek,
  getKolkataTomorrowDateString,
} from '@ksheeraam/contracts';
import { ISubscription, SubscriptionModel } from '../../models/Subscription';
import { UserModel } from '../../models/User';
import { AddressModel } from '../../models/Address';
import { ProductModel } from '../../models/Product';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { env } from '../../config/env';

export function mapSubscriptionToDto(s: ISubscription, walletBalancePaise = 0): SubscriptionDto {
  return {
    id: s._id.toString(),
    subscriptionNumber: s.subscriptionNumber,
    customerId: s.customerId.toString(),
    customerName: s.customerName,
    customerPhone: s.customerPhone,
    status: s.status,
    frequency: s.frequency,
    customDays: s.customDays,
    items: s.items.map((i: any) => ({
      productId: i.productId.toString(),
      variantId: i.variantId?.toString(),
      productName: i.productName,
      size: i.size,
      quantity: i.quantity,
      unitPricePaise: i.unitPricePaise,
    })),
    addressId: s.addressId.toString(),
    deliveryAddress: s.deliveryAddress,
    pincode: s.pincode,
    startDate: s.startDate,
    endDate: s.endDate,
    nextDeliveryDate: s.nextDeliveryDate,
    pauseStartDate: s.pauseStartDate,
    pauseEndDate: s.pauseEndDate,
    deliverySlot: s.deliverySlot,
    walletBalancePaise,
    isWalletSufficient: walletBalancePaise >= env.MIN_WALLET_BALANCE_PAISE,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export class SubscriptionsService {
  /**
   * Evaluates if a given date string (YYYY-MM-DD) is an eligible delivery day for the subscription.
   */
  isEligibleDeliveryDate(sub: ISubscription, dateKey: string): boolean {
    if (sub.status === SubscriptionStatus.CANCELLED) return false;
    if (dateKey < sub.startDate) return false;
    if (sub.endDate && dateKey > sub.endDate) return false;

    // Check pause window
    if (sub.pauseStartDate && sub.pauseEndDate) {
      if (dateKey >= sub.pauseStartDate && dateKey <= sub.pauseEndDate) {
        return false;
      }
    }

    if (sub.frequency === SubscriptionFrequency.DAILY) {
      return true;
    }

    if (sub.frequency === SubscriptionFrequency.ALTERNATE) {
      const start = new Date(sub.startDate);
      const current = new Date(dateKey);
      const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % 2 === 0;
    }

    if (sub.frequency === SubscriptionFrequency.CUSTOM) {
      if (!sub.customDays || sub.customDays.length === 0) return false;
      const dayOfWeek = getKolkataDayOfWeek(new Date(dateKey + 'T12:00:00Z'));
      return sub.customDays.includes(dayOfWeek);
    }

    return false;
  }

  /**
   * Computes the next eligible delivery date starting from a specified date.
   */
  findNextEligibleDeliveryDate(sub: ISubscription, fromDateKey: string): string {
    const cur = new Date(fromDateKey);
    // Scan up to 30 days ahead
    for (let i = 0; i < 30; i++) {
      const candidateStr = cur.toISOString().split('T')[0];
      if (this.isEligibleDeliveryDate(sub, candidateStr)) {
        return candidateStr;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return fromDateKey;
  }

  async listSubscriptions(requestingUserId: string, requestingRole: Role, customerIdFilter?: string): Promise<SubscriptionDto[]> {
    const query: any = {};
    if (requestingRole !== Role.ADMIN) {
      query.customerId = requestingUserId;
    } else if (customerIdFilter) {
      query.customerId = customerIdFilter;
    }

    const subs = await SubscriptionModel.find(query).sort({ createdAt: -1 });

    // Retrieve user wallet balance
    const userIds = [...new Set(subs.map((s) => s.customerId.toString()))];
    const users = await UserModel.find({ _id: { $in: userIds } });
    const userWalletMap = new Map(users.map((u) => [u._id.toString(), u.walletBalancePaise]));

    return subs.map((s) => mapSubscriptionToDto(s, userWalletMap.get(s.customerId.toString()) || 0));
  }

  async getSubscriptionById(id: string, requestingUserId: string, requestingRole: Role): Promise<SubscriptionDto> {
    const sub = await SubscriptionModel.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found.');

    if (requestingRole !== Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You can only view your own subscription.');
    }

    const user = await UserModel.findById(sub.customerId);
    return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
  }

  async createSubscription(userId: string, data: CreateSubscriptionDto): Promise<SubscriptionDto> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('Customer user not found.');

    const address = await AddressModel.findById(data.addressId);
    if (!address) throw new NotFoundError('Delivery address not found.');

    // Fetch and snapshot live product pricing in integer paise
    const itemSnapshots = [];
    for (const item of data.items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId} not found.`);

      const variant = product.variants.find((v) => v.size === item.size) || product.variants[0];
      itemSnapshots.push({
        productId: product._id as mongoose.Types.ObjectId,
        variantId: variant._id as mongoose.Types.ObjectId,
        productName: product.name,
        size: item.size,
        quantity: item.quantity,
        unitPricePaise: variant.pricePaise,
      });
    }

    const count = await SubscriptionModel.countDocuments();
    const subNumber = `SUB-${getKolkataDateString().replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    // Preliminary instance to determine next delivery date
    const dummySub = {
      status: SubscriptionStatus.ACTIVE,
      frequency: data.frequency,
      customDays: data.customDays,
      startDate: data.startDate,
    } as ISubscription;

    const nextDeliveryDate = this.findNextEligibleDeliveryDate(dummySub, data.startDate);

    const fullAddress = `${address.flatNumber}, ${address.buildingName}, ${address.streetArea}${address.landmark ? ', near ' + address.landmark : ''}, ${address.city} - ${address.pincode}`;

    const sub = await SubscriptionModel.create({
      subscriptionNumber: subNumber,
      customerId: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      status: SubscriptionStatus.ACTIVE,
      frequency: data.frequency,
      customDays: data.customDays,
      items: itemSnapshots,
      addressId: address._id,
      deliveryAddress: fullAddress,
      pincode: address.pincode,
      startDate: data.startDate,
      nextDeliveryDate,
      deliverySlot: data.deliverySlot || 'Morning 6:00 AM - 7:30 AM',
    });

    return mapSubscriptionToDto(sub, user.walletBalancePaise);
  }

  async pauseSubscription(
    id: string,
    requestingUserId: string,
    requestingRole: Role,
    data: PauseSubscriptionDto
  ): Promise<SubscriptionDto> {
    const sub = await SubscriptionModel.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found.');

    if (requestingRole !== Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You are not authorized to pause this subscription.');
    }

    sub.status = SubscriptionStatus.PAUSED;
    sub.pauseStartDate = data.pauseStartDate;
    sub.pauseEndDate = data.pauseEndDate;

    // Next delivery will be the first eligible delivery after pauseEndDate
    const resumeDay = new Date(data.pauseEndDate);
    resumeDay.setDate(resumeDay.getDate() + 1);
    const resumeDayStr = resumeDay.toISOString().split('T')[0];

    sub.nextDeliveryDate = this.findNextEligibleDeliveryDate(sub, resumeDayStr);
    await sub.save();

    const user = await UserModel.findById(sub.customerId);
    return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
  }

  async resumeSubscription(id: string, requestingUserId: string, requestingRole: Role): Promise<SubscriptionDto> {
    const sub = await SubscriptionModel.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found.');

    if (requestingRole !== Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You are not authorized to resume this subscription.');
    }

    sub.status = SubscriptionStatus.ACTIVE;
    sub.pauseStartDate = undefined;
    sub.pauseEndDate = undefined;

    const tomorrow = getKolkataTomorrowDateString();
    sub.nextDeliveryDate = this.findNextEligibleDeliveryDate(sub, tomorrow);
    await sub.save();

    const user = await UserModel.findById(sub.customerId);
    return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
  }

  async cancelSubscription(id: string, requestingUserId: string, requestingRole: Role): Promise<SubscriptionDto> {
    const sub = await SubscriptionModel.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found.');

    if (requestingRole !== Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You are not authorized to cancel this subscription.');
    }

    sub.status = SubscriptionStatus.CANCELLED;
    await sub.save();

    const user = await UserModel.findById(sub.customerId);
    return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
  }

  async updateSchedule(
    id: string,
    requestingUserId: string,
    requestingRole: Role,
    data: UpdateSubscriptionScheduleDto
  ): Promise<SubscriptionDto> {
    const sub = await SubscriptionModel.findById(id);
    if (!sub) throw new NotFoundError('Subscription not found.');

    if (requestingRole !== Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You are not authorized to modify this subscription schedule.');
    }

    if (data.frequency) sub.frequency = data.frequency;
    if (data.customDays) sub.customDays = data.customDays;

    if (data.items && data.items.length > 0) {
      const itemSnapshots = [];
      for (const item of data.items) {
        const product = await ProductModel.findById(item.productId);
        if (product) {
          const variant = product.variants.find((v) => v.size === item.size) || product.variants[0];
          itemSnapshots.push({
            productId: product._id as mongoose.Types.ObjectId,
            variantId: variant._id as mongoose.Types.ObjectId,
            productName: product.name,
            size: item.size,
            quantity: item.quantity,
            unitPricePaise: variant.pricePaise,
          });
        }
      }
      sub.items = itemSnapshots as any;
    }

    sub.nextDeliveryDate = this.findNextEligibleDeliveryDate(sub, data.effectiveFromDate);
    await sub.save();

    const user = await UserModel.findById(sub.customerId);
    return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
  }

  async quoteSubscription(data: any) {
    let perDeliveryTotalPaise = 0;

    const items = Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : data.productId
      ? [{ productId: data.productId, variantId: data.variantId, size: data.size, quantity: data.quantity || 1 }]
      : [];

    for (const item of items) {
      let product = null;
      if (mongoose.isValidObjectId(item.productId)) {
        product = await ProductModel.findById(item.productId);
      }
      if (!product) {
        product = await ProductModel.findOne({ slug: item.productId });
      }

      if (product) {
        let variant = null;
        if (item.variantId && mongoose.isValidObjectId(item.variantId)) {
          variant = product.variants.find((v) => v._id?.toString() === item.variantId);
        }
        if (!variant && item.size) {
          variant = product.variants.find((v) => v.size === item.size);
        }
        if (!variant) {
          variant = product.variants[0];
        }

        const price = variant?.pricePaise || 6800;
        perDeliveryTotalPaise += price * (item.quantity || 1);
      } else {
        perDeliveryTotalPaise += 6800 * (item.quantity || 1);
      }
    }

    const freq = data.frequency || SubscriptionFrequency.DAILY;
    let deliveriesPerMonth = 30;
    if (freq === SubscriptionFrequency.ALTERNATE) {
      deliveriesPerMonth = 15;
    } else if (freq === SubscriptionFrequency.CUSTOM) {
      const daysCount = data.customDays && data.customDays.length > 0 ? data.customDays.length : 3;
      deliveriesPerMonth = Math.round(daysCount * 4.3);
    }

    const monthlyTotalPaise = perDeliveryTotalPaise * deliveriesPerMonth;
    const bottleDepositPaise = 10000;
    const discountAmountPaise = Math.round(monthlyTotalPaise * 0.05);
    const taxAmountPaise = 0;
    const totalPayableNowPaise = monthlyTotalPaise - discountAmountPaise + bottleDepositPaise;

    return {
      perDeliveryTotal: perDeliveryTotalPaise / 100,
      estimatedDeliveriesPerMonth: deliveriesPerMonth,
      monthlyTotal: Math.round(monthlyTotalPaise / 100),
      monthlyEstimate: Math.round(monthlyTotalPaise / 100),
      bottleDeposit: bottleDepositPaise / 100,
      discountAmount: Math.round(discountAmountPaise / 100),
      taxAmount: 0,
      totalPayableNow: Math.round(totalPayableNowPaise / 100),
      currency: 'INR',
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      canDeliverToPincode: true,
      pincodeDeliveryMessage: 'Doorstep morning delivery available (5:30 AM – 7:00 AM)',
    };
  }
}

export const subscriptionsService = new SubscriptionsService();
