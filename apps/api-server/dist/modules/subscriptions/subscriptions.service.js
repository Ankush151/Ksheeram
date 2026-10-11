"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionsService = exports.SubscriptionsService = void 0;
exports.mapSubscriptionToDto = mapSubscriptionToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const Subscription_1 = require("../../models/Subscription");
const User_1 = require("../../models/User");
const Address_1 = require("../../models/Address");
const Product_1 = require("../../models/Product");
const errors_1 = require("../../utils/errors");
const env_1 = require("../../config/env");
function mapSubscriptionToDto(s, walletBalancePaise = 0) {
    return {
        id: s._id.toString(),
        subscriptionNumber: s.subscriptionNumber,
        customerId: s.customerId.toString(),
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        status: s.status,
        frequency: s.frequency,
        customDays: s.customDays,
        items: s.items.map((i) => ({
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
        isWalletSufficient: walletBalancePaise >= env_1.env.MIN_WALLET_BALANCE_PAISE,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    };
}
class SubscriptionsService {
    /**
     * Evaluates if a given date string (YYYY-MM-DD) is an eligible delivery day for the subscription.
     */
    isEligibleDeliveryDate(sub, dateKey) {
        if (sub.status === contracts_1.SubscriptionStatus.CANCELLED)
            return false;
        if (dateKey < sub.startDate)
            return false;
        if (sub.endDate && dateKey > sub.endDate)
            return false;
        // Check pause window
        if (sub.pauseStartDate && sub.pauseEndDate) {
            if (dateKey >= sub.pauseStartDate && dateKey <= sub.pauseEndDate) {
                return false;
            }
        }
        if (sub.frequency === contracts_1.SubscriptionFrequency.DAILY) {
            return true;
        }
        if (sub.frequency === contracts_1.SubscriptionFrequency.ALTERNATE) {
            const start = new Date(sub.startDate);
            const current = new Date(dateKey);
            const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays % 2 === 0;
        }
        if (sub.frequency === contracts_1.SubscriptionFrequency.CUSTOM) {
            if (!sub.customDays || sub.customDays.length === 0)
                return false;
            const dayOfWeek = (0, contracts_1.getKolkataDayOfWeek)(new Date(dateKey + 'T12:00:00Z'));
            return sub.customDays.includes(dayOfWeek);
        }
        return false;
    }
    /**
     * Computes the next eligible delivery date starting from a specified date.
     */
    findNextEligibleDeliveryDate(sub, fromDateKey) {
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
    async listSubscriptions(requestingUserId, requestingRole, customerIdFilter) {
        const query = {};
        if (requestingRole !== contracts_1.Role.ADMIN) {
            query.customerId = requestingUserId;
        }
        else if (customerIdFilter) {
            query.customerId = customerIdFilter;
        }
        const subs = await Subscription_1.SubscriptionModel.find(query).sort({ createdAt: -1 });
        // Retrieve user wallet balance
        const userIds = [...new Set(subs.map((s) => s.customerId.toString()))];
        const users = await User_1.UserModel.find({ _id: { $in: userIds } });
        const userWalletMap = new Map(users.map((u) => [u._id.toString(), u.walletBalancePaise]));
        return subs.map((s) => mapSubscriptionToDto(s, userWalletMap.get(s.customerId.toString()) || 0));
    }
    async getSubscriptionById(id, requestingUserId, requestingRole) {
        const sub = await Subscription_1.SubscriptionModel.findById(id);
        if (!sub)
            throw new errors_1.NotFoundError('Subscription not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You can only view your own subscription.');
        }
        const user = await User_1.UserModel.findById(sub.customerId);
        return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
    }
    async createSubscription(userId, data) {
        const user = await User_1.UserModel.findById(userId);
        if (!user)
            throw new errors_1.NotFoundError('Customer user not found.');
        const address = await Address_1.AddressModel.findById(data.addressId);
        if (!address)
            throw new errors_1.NotFoundError('Delivery address not found.');
        // Fetch and snapshot live product pricing in integer paise
        const itemSnapshots = [];
        for (const item of data.items) {
            const product = await Product_1.ProductModel.findById(item.productId);
            if (!product)
                throw new errors_1.NotFoundError(`Product ${item.productId} not found.`);
            const variant = product.variants.find((v) => v.size === item.size) || product.variants[0];
            itemSnapshots.push({
                productId: product._id,
                variantId: variant._id,
                productName: product.name,
                size: item.size,
                quantity: item.quantity,
                unitPricePaise: variant.pricePaise,
            });
        }
        const count = await Subscription_1.SubscriptionModel.countDocuments();
        const subNumber = `SUB-${(0, contracts_1.getKolkataDateString)().replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
        // Preliminary instance to determine next delivery date
        const dummySub = {
            status: contracts_1.SubscriptionStatus.ACTIVE,
            frequency: data.frequency,
            customDays: data.customDays,
            startDate: data.startDate,
        };
        const nextDeliveryDate = this.findNextEligibleDeliveryDate(dummySub, data.startDate);
        const fullAddress = `${address.flatNumber}, ${address.buildingName}, ${address.streetArea}${address.landmark ? ', near ' + address.landmark : ''}, ${address.city} - ${address.pincode}`;
        const sub = await Subscription_1.SubscriptionModel.create({
            subscriptionNumber: subNumber,
            customerId: user._id,
            customerName: user.name,
            customerPhone: user.phone,
            status: contracts_1.SubscriptionStatus.ACTIVE,
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
    async pauseSubscription(id, requestingUserId, requestingRole, data) {
        const sub = await Subscription_1.SubscriptionModel.findById(id);
        if (!sub)
            throw new errors_1.NotFoundError('Subscription not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You are not authorized to pause this subscription.');
        }
        sub.status = contracts_1.SubscriptionStatus.PAUSED;
        sub.pauseStartDate = data.pauseStartDate;
        sub.pauseEndDate = data.pauseEndDate;
        // Next delivery will be the first eligible delivery after pauseEndDate
        const resumeDay = new Date(data.pauseEndDate);
        resumeDay.setDate(resumeDay.getDate() + 1);
        const resumeDayStr = resumeDay.toISOString().split('T')[0];
        sub.nextDeliveryDate = this.findNextEligibleDeliveryDate(sub, resumeDayStr);
        await sub.save();
        const user = await User_1.UserModel.findById(sub.customerId);
        return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
    }
    async resumeSubscription(id, requestingUserId, requestingRole) {
        const sub = await Subscription_1.SubscriptionModel.findById(id);
        if (!sub)
            throw new errors_1.NotFoundError('Subscription not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You are not authorized to resume this subscription.');
        }
        sub.status = contracts_1.SubscriptionStatus.ACTIVE;
        sub.pauseStartDate = undefined;
        sub.pauseEndDate = undefined;
        const tomorrow = (0, contracts_1.getKolkataTomorrowDateString)();
        sub.nextDeliveryDate = this.findNextEligibleDeliveryDate(sub, tomorrow);
        await sub.save();
        const user = await User_1.UserModel.findById(sub.customerId);
        return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
    }
    async cancelSubscription(id, requestingUserId, requestingRole) {
        const sub = await Subscription_1.SubscriptionModel.findById(id);
        if (!sub)
            throw new errors_1.NotFoundError('Subscription not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You are not authorized to cancel this subscription.');
        }
        sub.status = contracts_1.SubscriptionStatus.CANCELLED;
        await sub.save();
        const user = await User_1.UserModel.findById(sub.customerId);
        return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
    }
    async updateSchedule(id, requestingUserId, requestingRole, data) {
        const sub = await Subscription_1.SubscriptionModel.findById(id);
        if (!sub)
            throw new errors_1.NotFoundError('Subscription not found.');
        if (requestingRole !== contracts_1.Role.ADMIN && sub.customerId.toString() !== requestingUserId) {
            throw new errors_1.ForbiddenError('You are not authorized to modify this subscription schedule.');
        }
        if (data.frequency)
            sub.frequency = data.frequency;
        if (data.customDays)
            sub.customDays = data.customDays;
        if (data.items && data.items.length > 0) {
            const itemSnapshots = [];
            for (const item of data.items) {
                const product = await Product_1.ProductModel.findById(item.productId);
                if (product) {
                    const variant = product.variants.find((v) => v.size === item.size) || product.variants[0];
                    itemSnapshots.push({
                        productId: product._id,
                        variantId: variant._id,
                        productName: product.name,
                        size: item.size,
                        quantity: item.quantity,
                        unitPricePaise: variant.pricePaise,
                    });
                }
            }
            sub.items = itemSnapshots;
        }
        sub.nextDeliveryDate = this.findNextEligibleDeliveryDate(sub, data.effectiveFromDate);
        await sub.save();
        const user = await User_1.UserModel.findById(sub.customerId);
        return mapSubscriptionToDto(sub, user?.walletBalancePaise || 0);
    }
    async quoteSubscription(data) {
        let perDeliveryTotalPaise = 0;
        const items = Array.isArray(data.items) && data.items.length > 0
            ? data.items
            : data.productId
                ? [{ productId: data.productId, variantId: data.variantId, size: data.size, quantity: data.quantity || 1 }]
                : [];
        for (const item of items) {
            let product = null;
            if (mongoose_1.default.isValidObjectId(item.productId)) {
                product = await Product_1.ProductModel.findById(item.productId);
            }
            if (!product) {
                product = await Product_1.ProductModel.findOne({ slug: item.productId });
            }
            if (product) {
                let variant = null;
                if (item.variantId && mongoose_1.default.isValidObjectId(item.variantId)) {
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
            }
            else {
                perDeliveryTotalPaise += 6800 * (item.quantity || 1);
            }
        }
        const freq = data.frequency || contracts_1.SubscriptionFrequency.DAILY;
        let deliveriesPerMonth = 30;
        if (freq === contracts_1.SubscriptionFrequency.ALTERNATE) {
            deliveriesPerMonth = 15;
        }
        else if (freq === contracts_1.SubscriptionFrequency.CUSTOM) {
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
exports.SubscriptionsService = SubscriptionsService;
exports.subscriptionsService = new SubscriptionsService();
//# sourceMappingURL=subscriptions.service.js.map