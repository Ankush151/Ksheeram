export declare enum Role {
    CUSTOMER = "customer",
    ADMIN = "admin",
    DELIVERY_AGENT = "delivery_agent"
}
export declare enum PackageSize {
    ML_500 = "500ml",
    L_1 = "1L"
}
export declare enum PackagingType {
    GLASS_BOTTLE = "glass_bottle",
    ECO_POUCH = "eco_pouch"
}
export declare enum MilkCategory {
    COW_MILK = "cow_milk",
    A2_GIR_COW = "a2_milk",
    BUFFALO_MILK = "buffalo_milk",
    GHEE = "ghee",
    PANEER = "paneer",
    CURD = "curd"
}
export declare enum SubscriptionFrequency {
    DAILY = "daily",
    ALTERNATE = "alternate",
    CUSTOM = "custom"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    CANCELLED = "cancelled"
}
export declare enum OrderType {
    ONE_TIME = "one_time",
    SUBSCRIPTION = "subscription_delivery"
}
export declare enum OrderStatus {
    PLACED = "placed",
    CONFIRMED = "confirmed",
    PACKED = "packed",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare enum PaymentMethod {
    WALLET = "wallet",
    UPI = "upi",
    CARD = "card",
    COD = "cod"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum StockMovementType {
    PROCUREMENT_INWARD = "procurement_inward",
    ORDER_RESERVATION = "order_reservation",
    MORNING_DISPATCH = "morning_dispatch",
    DAMAGE_SPOILAGE = "damage_spoilage",
    AUDIT_ADJUSTMENT = "audit_adjustment",
    RETURN_RESTOCK = "return_restock"
}
export declare enum DeliveryStatus {
    ASSIGNED = "assigned",
    OUT_FOR_DELIVERY = "out_for_delivery",
    DELIVERED = "delivered",
    FAILED = "failed"
}
export declare enum DeliveryFailureReason {
    DOOR_LOCKED = "door_locked_no_drop_box",
    CUSTOMER_UNREACHABLE = "customer_unreachable",
    INCORRECT_ADDRESS = "incorrect_address",
    BOTTLE_LEAKAGE = "bottle_leakage",
    OTHER = "other"
}
export declare enum BillingType {
    PREPAID_SUBSCRIPTION = "prepaid_subscription",
    ONE_TIME_ORDER = "one_time_order",
    WALLET_RECHARGE = "wallet_recharge"
}
export declare enum InvoiceStatus {
    PAID = "paid",
    PENDING = "pending",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare enum LedgerEntryType {
    CREDIT = "credit",
    DEBIT = "debit"
}
export declare enum WhatsAppMessageStatus {
    NEW = "new",
    IN_PROGRESS = "in_progress",
    CONVERTED = "converted",
    DISMISSED = "dismissed"
}
//# sourceMappingURL=enums.d.ts.map