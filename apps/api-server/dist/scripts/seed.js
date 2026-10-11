"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const contracts_1 = require("@ksheeraam/contracts");
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const Address_1 = require("../models/Address");
const Product_1 = require("../models/Product");
const Supplier_1 = require("../models/Supplier");
const PurchaseOrder_1 = require("../models/PurchaseOrder");
const Inventory_1 = require("../models/Inventory");
const Subscription_1 = require("../models/Subscription");
const Order_1 = require("../models/Order");
const DeliveryAssignment_1 = require("../models/DeliveryAssignment");
const Billing_1 = require("../models/Billing");
const WhatsApp_1 = require("../models/WhatsApp");
/**
 * -------------------------------------------------------------
 * DEVELOPMENT SEED DATA
 * WARNING: FOR LOCAL AND STAGING DEVELOPMENT ONLY.
 * DO NOT RUN THIS IN PRODUCTION.
 * -------------------------------------------------------------
 */
async function seedDatabase() {
    console.log('[Seed] Connecting to MongoDB...');
    await (0, database_1.connectDatabase)();
    console.log('[Seed] Clearing existing collections (NON-PRODUCTION SEED)...');
    await Promise.all([
        User_1.UserModel.deleteMany({}),
        Address_1.AddressModel.deleteMany({}),
        Product_1.ProductModel.deleteMany({}),
        Supplier_1.SupplierModel.deleteMany({}),
        PurchaseOrder_1.PurchaseOrderModel.deleteMany({}),
        Inventory_1.InventoryBalanceModel.deleteMany({}),
        Inventory_1.InventoryMovementModel.deleteMany({}),
        Subscription_1.SubscriptionModel.deleteMany({}),
        Order_1.OrderModel.deleteMany({}),
        DeliveryAssignment_1.DeliveryAssignmentModel.deleteMany({}),
        Billing_1.InvoiceModel.deleteMany({}),
        Billing_1.PaymentModel.deleteMany({}),
        Billing_1.PrepaidLedgerEntryModel.deleteMany({}),
        WhatsApp_1.WhatsAppMessageRecordModel.deleteMany({}),
    ]);
    const defaultPasswordHash = await bcryptjs_1.default.hash('Ksheeraam@123', 10);
    console.log('[Seed] 1. Creating Seed Users...');
    const [adminUser, agentUser, customerUser] = await User_1.UserModel.create([
        {
            name: 'Rajesh Sharma (Admin)',
            phone: '9876543210',
            email: 'admin@ksheeraam.com',
            passwordHash: defaultPasswordHash,
            role: contracts_1.Role.ADMIN,
            walletBalancePaise: 1000000,
            isActive: true,
        },
        {
            name: 'Suresh Kumar (Agent)',
            phone: '9876543211',
            email: 'agent@ksheeraam.com',
            passwordHash: defaultPasswordHash,
            role: contracts_1.Role.DELIVERY_AGENT,
            assignedRoute: 'Route A: Indiranagar - Domlur',
            vehicleNumber: 'KA-01-EQ-4421',
            walletBalancePaise: 0,
            isActive: true,
        },
        {
            name: 'Ananya Verma (Customer)',
            phone: '9876543212',
            email: 'customer@ksheeraam.com',
            passwordHash: defaultPasswordHash,
            role: contracts_1.Role.CUSTOMER,
            walletBalancePaise: 250000, // ₹2,500.00 prepaid balance
            isActive: true,
        },
    ]);
    console.log('[Seed] 2. Creating Customer Addresses...');
    const [homeAddress] = await Address_1.AddressModel.create([
        {
            userId: customerUser._id,
            label: 'Home',
            flatNumber: 'Flat 402, 4th Floor',
            buildingName: 'Gulmohar Enclave',
            streetArea: '12th Main Road, HAL 2nd Stage, Indiranagar',
            landmark: 'Near ESI Hospital',
            city: 'Bangalore',
            pincode: '560038',
            isDefault: true,
            deliveryInstructions: 'Ring bell once and leave bottles inside the insulated milk bag at door hook.',
        },
    ]);
    console.log('[Seed] 3. Creating Product Catalog...');
    const products = await Product_1.ProductModel.create([
        {
            name: 'A2 Gir Cow Fresh Milk',
            slug: 'a2-gir-cow-milk',
            description: 'Single-origin pure A2 beta-casein whole milk from pasture-fed indigenous Gir cows. Chilled instantly to 4°C within 15 minutes of milking.',
            category: contracts_1.MilkCategory.A2_GIR_COW,
            fatContent: '4.5% Min',
            snfContent: '8.5% Min',
            coldChainTemp: '4°C Strict',
            shelfLife: '48 hours from dispatch',
            imageUrl: '/images/products/a2-cow-milk.png',
            isActive: true,
            variants: [
                {
                    size: contracts_1.PackageSize.ML_500,
                    packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                    pricePaise: 4800, // ₹48.00
                    mrpPaise: 5000,
                    inStock: true,
                    saleableUnits: 250,
                },
                {
                    size: contracts_1.PackageSize.L_1,
                    packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                    pricePaise: 8800, // ₹88.00
                    mrpPaise: 9500,
                    inStock: true,
                    saleableUnits: 300,
                },
            ],
        },
        {
            name: 'Farm Fresh Cow Whole Milk',
            slug: 'farm-fresh-cow-milk',
            description: 'Daily fresh cow milk sourced from local village farms. Unadulterated, unhomogenized natural milk with clean creamy texture.',
            category: contracts_1.MilkCategory.COW_MILK,
            fatContent: '4.0% Min',
            snfContent: '8.5% Min',
            coldChainTemp: '4°C Strict',
            shelfLife: '48 hours from dispatch',
            imageUrl: '/images/products/cow-milk.png',
            isActive: true,
            variants: [
                {
                    size: contracts_1.PackageSize.ML_500,
                    packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                    pricePaise: 3800, // ₹38.00
                    mrpPaise: 4000,
                    inStock: true,
                    saleableUnits: 200,
                },
                {
                    size: contracts_1.PackageSize.L_1,
                    packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                    pricePaise: 7200, // ₹72.00
                    mrpPaise: 7500,
                    inStock: true,
                    saleableUnits: 250,
                },
            ],
        },
        {
            name: 'Creamy Buffalo Whole Milk',
            slug: 'creamy-buffalo-milk',
            description: 'High-fat wholesome buffalo milk ideal for traditional tea, rich curd, and homemade sweets.',
            category: contracts_1.MilkCategory.BUFFALO_MILK,
            fatContent: '6.5% Min',
            snfContent: '9.0% Min',
            coldChainTemp: '4°C Strict',
            shelfLife: '48 hours from dispatch',
            imageUrl: '/images/products/buffalo-milk.png',
            isActive: true,
            variants: [
                {
                    size: contracts_1.PackageSize.ML_500,
                    packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                    pricePaise: 4400, // ₹44.00
                    mrpPaise: 4800,
                    inStock: true,
                    saleableUnits: 150,
                },
                {
                    size: contracts_1.PackageSize.L_1,
                    packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                    pricePaise: 8200, // ₹82.00
                    mrpPaise: 8800,
                    inStock: true,
                    saleableUnits: 200,
                },
            ],
        },
    ]);
    console.log('[Seed] 4. Initializing Packaged-Unit Inventory Balances...');
    for (const product of products) {
        for (const variant of product.variants) {
            await Inventory_1.InventoryBalanceModel.create({
                productId: product._id,
                productName: product.name,
                size: variant.size,
                packagingType: variant.packagingType,
                physicalUnits: 120, // 120 units on hand
                reservedUnits: 20, // 20 units allocated
                damagedUnits: 1,
                reorderLevel: 25,
                lastUpdated: new Date(),
            });
        }
    }
    console.log('[Seed] 5. Creating Suppliers and Sample Dock Procurement PO...');
    const [supplier] = await Supplier_1.SupplierModel.create([
        {
            code: 'SUP-001',
            name: 'Sri Venkateshwara Organic Dairy Farm',
            contactPerson: 'Manjunath Gowda',
            phone: '9845012345',
            email: 'venkateshwara.dairy@gmail.com',
            villageDistrict: 'Kanakapura, Ramanagara District',
            state: 'Karnataka',
            milkTypes: ['A2 Gir Cow Milk', 'Desi Cow Milk'],
            dailySupplyCapacityUnits: 650,
            paymentTerms: 'Weekly Bank Transfer',
            rating: 4.9,
            status: 'active',
        },
    ]);
    const todayStr = (0, contracts_1.getKolkataDateString)();
    const tomorrowStr = (0, contracts_1.getKolkataTomorrowDateString)();
    await PurchaseOrder_1.PurchaseOrderModel.create({
        poNumber: `PO-${todayStr.replace(/-/g, '')}-001`,
        supplierId: supplier._id,
        supplierName: supplier.name,
        orderDate: todayStr,
        expectedDeliveryDate: todayStr,
        status: 'received',
        items: [
            {
                productId: products[0]._id,
                productName: products[0].name,
                size: contracts_1.PackageSize.L_1,
                packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                orderedUnits: 150,
                receivedUnits: 148,
                rejectedUnits: 2,
                rejectionReason: 'Temperature above 6°C on arrival check',
                unitCostPaise: 6200, // ₹62.00
                totalCostPaise: 148 * 6200,
            },
        ],
        totalUnitsOrdered: 150,
        totalUnitsReceived: 148,
        totalUnitsRejected: 2,
        totalCostPaise: 148 * 6200,
        chillingTempVerified: '3.6°C',
        qualityTesterName: 'Anil Kumar (Chief QA)',
        receivedAt: new Date(),
    });
    console.log('[Seed] 6. Creating Active Customer Recurring Subscription...');
    const sampleSubscription = await Subscription_1.SubscriptionModel.create({
        subscriptionNumber: `SUB-${todayStr.replace(/-/g, '')}-0001`,
        customerId: customerUser._id,
        customerName: customerUser.name,
        customerPhone: customerUser.phone,
        status: contracts_1.SubscriptionStatus.ACTIVE,
        frequency: contracts_1.SubscriptionFrequency.DAILY,
        items: [
            {
                productId: products[0]._id,
                variantId: products[0].variants[1]._id,
                productName: products[0].name,
                size: contracts_1.PackageSize.L_1,
                quantity: 1,
                unitPricePaise: 8800, // ₹88.00
            },
        ],
        addressId: homeAddress._id,
        deliveryAddress: `${homeAddress.flatNumber}, ${homeAddress.buildingName}, ${homeAddress.streetArea}, ${homeAddress.city} - ${homeAddress.pincode}`,
        pincode: homeAddress.pincode,
        startDate: todayStr,
        nextDeliveryDate: tomorrowStr,
        deliverySlot: 'Morning 6:00 AM - 7:30 AM',
    });
    console.log('[Seed] 7. Creating Orders and Delivery Manifest for Tomorrow...');
    const sampleOrder = await Order_1.OrderModel.create({
        orderNumber: `ORD-${tomorrowStr.replace(/-/g, '')}-0001`,
        customerId: customerUser._id,
        customerName: customerUser.name,
        customerPhone: customerUser.phone,
        orderType: contracts_1.OrderType.SUBSCRIPTION,
        status: contracts_1.OrderStatus.CONFIRMED,
        stockAllocated: true,
        paymentStatus: contracts_1.PaymentStatus.PAID,
        paymentMethod: contracts_1.PaymentMethod.WALLET,
        items: [
            {
                productId: products[0]._id,
                variantId: products[0].variants[1]._id,
                productName: products[0].name,
                size: contracts_1.PackageSize.L_1,
                packagingType: contracts_1.PackagingType.GLASS_BOTTLE,
                quantity: 1,
                unitPricePaise: 8800,
                subtotalPaise: 8800,
            },
        ],
        addressId: homeAddress._id,
        deliveryAddress: `${homeAddress.flatNumber}, ${homeAddress.buildingName}, ${homeAddress.streetArea}, ${homeAddress.city} - ${homeAddress.pincode}`,
        pincode: homeAddress.pincode,
        deliveryDate: tomorrowStr,
        deliverySlot: 'Morning 6:00 AM - 7:30 AM',
        subtotalPaise: 8800,
        deliveryFeePaise: 0,
        totalPaise: 8800,
        assignedAgentId: agentUser._id,
        assignedAgentName: agentUser.name,
        subscriptionId: sampleSubscription._id,
    });
    await DeliveryAssignment_1.DeliveryAssignmentModel.create({
        orderId: sampleOrder._id,
        orderNumber: sampleOrder.orderNumber,
        deliveryDate: tomorrowStr,
        assignedAgentId: agentUser._id,
        assignedAgentName: agentUser.name,
        status: 'assigned',
        amountToCollectPaise: 0,
        cashCollectedPaise: 0,
        events: [
            {
                status: 'assigned',
                timestamp: new Date(),
                notes: `Assigned to delivery agent ${agentUser.name}`,
            },
        ],
    });
    console.log('[Seed] 8. Creating Sample WhatsApp Conversational Lead...');
    await WhatsApp_1.WhatsAppMessageRecordModel.create({
        messageId: `wamid.HBgMOTE5ODc2NTQzMjEyFQIAEhgUM0FBQjEyMzQ1Njc4OTA`,
        senderPhone: '919876543212',
        customerName: 'Ananya Verma',
        customerId: customerUser._id,
        rawMessage: 'Hello, please pause my milk delivery from Oct 15 to Oct 18 as we are traveling.',
        status: 'new',
        detectedIntent: 'pause_request',
        receivedAt: new Date(),
    });
    console.log('\n--- Ksheeraam Seed Completed Successfully! ---');
    console.log('Seed Accounts:');
    console.log('1. Admin: admin@ksheeraam.com (Password: Ksheeraam@123)');
    console.log('2. Delivery Agent: agent@ksheeraam.com (Password: Ksheeraam@123)');
    console.log('3. Customer: customer@ksheeraam.com (Password: Ksheeraam@123)');
    console.log('-----------------------------------------------------\n');
    await (0, database_1.disconnectDatabase)();
}
seedDatabase().catch((err) => {
    console.error('[Seed] Failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map