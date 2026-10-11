"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppMessageStatus = exports.LedgerEntryType = exports.InvoiceStatus = exports.BillingType = exports.DeliveryFailureReason = exports.DeliveryStatus = exports.StockMovementType = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = exports.OrderType = exports.SubscriptionStatus = exports.SubscriptionFrequency = exports.MilkCategory = exports.PackagingType = exports.PackageSize = exports.Role = void 0;
var Role;
(function (Role) {
    Role["CUSTOMER"] = "customer";
    Role["ADMIN"] = "admin";
    Role["DELIVERY_AGENT"] = "delivery_agent";
})(Role || (exports.Role = Role = {}));
var PackageSize;
(function (PackageSize) {
    PackageSize["ML_500"] = "500ml";
    PackageSize["L_1"] = "1L";
})(PackageSize || (exports.PackageSize = PackageSize = {}));
var PackagingType;
(function (PackagingType) {
    PackagingType["GLASS_BOTTLE"] = "glass_bottle";
    PackagingType["ECO_POUCH"] = "eco_pouch";
})(PackagingType || (exports.PackagingType = PackagingType = {}));
var MilkCategory;
(function (MilkCategory) {
    MilkCategory["COW_MILK"] = "cow_milk";
    MilkCategory["A2_GIR_COW"] = "a2_milk";
    MilkCategory["BUFFALO_MILK"] = "buffalo_milk";
    MilkCategory["GHEE"] = "ghee";
    MilkCategory["PANEER"] = "paneer";
    MilkCategory["CURD"] = "curd";
})(MilkCategory || (exports.MilkCategory = MilkCategory = {}));
var SubscriptionFrequency;
(function (SubscriptionFrequency) {
    SubscriptionFrequency["DAILY"] = "daily";
    SubscriptionFrequency["ALTERNATE"] = "alternate";
    SubscriptionFrequency["CUSTOM"] = "custom";
})(SubscriptionFrequency || (exports.SubscriptionFrequency = SubscriptionFrequency = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAUSED"] = "paused";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["ONE_TIME"] = "one_time";
    OrderType["SUBSCRIPTION"] = "subscription_delivery";
})(OrderType || (exports.OrderType = OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PLACED"] = "placed";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PACKED"] = "packed";
    OrderStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["WALLET"] = "wallet";
    PaymentMethod["UPI"] = "upi";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["COD"] = "cod";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var StockMovementType;
(function (StockMovementType) {
    StockMovementType["PROCUREMENT_INWARD"] = "procurement_inward";
    StockMovementType["ORDER_RESERVATION"] = "order_reservation";
    StockMovementType["MORNING_DISPATCH"] = "morning_dispatch";
    StockMovementType["DAMAGE_SPOILAGE"] = "damage_spoilage";
    StockMovementType["AUDIT_ADJUSTMENT"] = "audit_adjustment";
    StockMovementType["RETURN_RESTOCK"] = "return_restock";
})(StockMovementType || (exports.StockMovementType = StockMovementType = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["ASSIGNED"] = "assigned";
    DeliveryStatus["OUT_FOR_DELIVERY"] = "out_for_delivery";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["FAILED"] = "failed";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var DeliveryFailureReason;
(function (DeliveryFailureReason) {
    DeliveryFailureReason["DOOR_LOCKED"] = "door_locked_no_drop_box";
    DeliveryFailureReason["CUSTOMER_UNREACHABLE"] = "customer_unreachable";
    DeliveryFailureReason["INCORRECT_ADDRESS"] = "incorrect_address";
    DeliveryFailureReason["BOTTLE_LEAKAGE"] = "bottle_leakage";
    DeliveryFailureReason["OTHER"] = "other";
})(DeliveryFailureReason || (exports.DeliveryFailureReason = DeliveryFailureReason = {}));
var BillingType;
(function (BillingType) {
    BillingType["PREPAID_SUBSCRIPTION"] = "prepaid_subscription";
    BillingType["ONE_TIME_ORDER"] = "one_time_order";
    BillingType["WALLET_RECHARGE"] = "wallet_recharge";
})(BillingType || (exports.BillingType = BillingType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var LedgerEntryType;
(function (LedgerEntryType) {
    LedgerEntryType["CREDIT"] = "credit";
    LedgerEntryType["DEBIT"] = "debit";
})(LedgerEntryType || (exports.LedgerEntryType = LedgerEntryType = {}));
var WhatsAppMessageStatus;
(function (WhatsAppMessageStatus) {
    WhatsAppMessageStatus["NEW"] = "new";
    WhatsAppMessageStatus["IN_PROGRESS"] = "in_progress";
    WhatsAppMessageStatus["CONVERTED"] = "converted";
    WhatsAppMessageStatus["DISMISSED"] = "dismissed";
})(WhatsAppMessageStatus || (exports.WhatsAppMessageStatus = WhatsAppMessageStatus = {}));
//# sourceMappingURL=enums.js.map