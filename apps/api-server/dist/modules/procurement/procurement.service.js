"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.procurementService = exports.ProcurementService = void 0;
exports.mapPOToDto = mapPOToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const PurchaseOrder_1 = require("../../models/PurchaseOrder");
const Supplier_1 = require("../../models/Supplier");
const inventory_service_1 = require("../inventory/inventory.service");
const errors_1 = require("../../utils/errors");
const contracts_1 = require("@ksheeraam/contracts");
const database_1 = require("../../config/database");
function mapPOToDto(po) {
    return {
        id: po._id.toString(),
        poNumber: po.poNumber,
        supplierId: po.supplierId.toString(),
        supplierName: po.supplierName,
        orderDate: po.orderDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        status: po.status,
        items: po.items.map((i) => ({
            id: i._id?.toString(),
            productId: i.productId.toString(),
            productName: i.productName,
            size: i.size,
            packagingType: i.packagingType,
            orderedUnits: i.orderedUnits,
            receivedUnits: i.receivedUnits,
            rejectedUnits: i.rejectedUnits,
            unitCostPaise: i.unitCostPaise,
            totalCostPaise: i.totalCostPaise,
            rejectionReason: i.rejectionReason,
        })),
        totalUnitsOrdered: po.totalUnitsOrdered,
        totalUnitsReceived: po.totalUnitsReceived,
        totalUnitsRejected: po.totalUnitsRejected,
        totalCostPaise: po.totalCostPaise,
        chillingTempVerified: po.chillingTempVerified,
        qualityTesterName: po.qualityTesterName,
        notes: po.notes,
        createdAt: po.createdAt.toISOString(),
        receivedAt: po.receivedAt ? po.receivedAt.toISOString() : undefined,
    };
}
class ProcurementService {
    async listPurchaseOrders() {
        const pos = await PurchaseOrder_1.PurchaseOrderModel.find().sort({ createdAt: -1 });
        return pos.map(mapPOToDto);
    }
    async getPurchaseOrderById(id) {
        const po = await PurchaseOrder_1.PurchaseOrderModel.findById(id);
        if (!po)
            throw new errors_1.NotFoundError('Purchase order not found.');
        return mapPOToDto(po);
    }
    async createPurchaseOrder(data) {
        const supplier = await Supplier_1.SupplierModel.findById(data.supplierId);
        if (!supplier)
            throw new errors_1.NotFoundError('Supplier not found.');
        const count = await PurchaseOrder_1.PurchaseOrderModel.countDocuments();
        const poNumber = `PO-${(0, contracts_1.getKolkataDateString)().replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;
        let totalUnitsOrdered = 0;
        let totalCostPaise = 0;
        const items = data.items.map((item) => {
            const itemTotalCost = item.orderedUnits * item.unitCostPaise;
            totalUnitsOrdered += item.orderedUnits;
            totalCostPaise += itemTotalCost;
            return {
                productId: new mongoose_1.default.Types.ObjectId(item.productId),
                productName: item.productName,
                size: item.size,
                packagingType: item.packagingType,
                orderedUnits: item.orderedUnits,
                receivedUnits: 0,
                rejectedUnits: 0,
                unitCostPaise: item.unitCostPaise,
                totalCostPaise: itemTotalCost,
            };
        });
        const po = await PurchaseOrder_1.PurchaseOrderModel.create({
            poNumber,
            supplierId: supplier._id,
            supplierName: supplier.name,
            orderDate: (0, contracts_1.getKolkataDateString)(),
            expectedDeliveryDate: data.expectedDeliveryDate,
            status: 'ordered',
            items,
            totalUnitsOrdered,
            totalUnitsReceived: 0,
            totalUnitsRejected: 0,
            totalCostPaise,
            notes: data.notes,
        });
        return mapPOToDto(po);
    }
    async receiveStock(data, performedBy) {
        return (0, database_1.withTransaction)(async (session) => {
            const po = await PurchaseOrder_1.PurchaseOrderModel.findById(data.poId).session(session || null);
            if (!po)
                throw new errors_1.NotFoundError('Purchase order not found.');
            if (po.status === 'received') {
                throw new errors_1.AppError('This purchase order has already been marked as received.', 400, 'ALREADY_RECEIVED');
            }
            let totalReceived = 0;
            let totalRejected = 0;
            for (const receiveItem of data.items) {
                const item = po.items.find((i) => i._id?.toString() === receiveItem.itemId);
                if (item) {
                    item.receivedUnits = receiveItem.receivedUnits;
                    item.rejectedUnits = receiveItem.rejectedUnits;
                    item.rejectionReason = receiveItem.rejectionReason;
                    totalReceived += receiveItem.receivedUnits;
                    totalRejected += receiveItem.rejectedUnits;
                    // Inward accepted units into physical inventory
                    if (receiveItem.receivedUnits > 0) {
                        await inventory_service_1.inventoryService.inwardProcuredStock(item.productId.toString(), item.size, item.packagingType, receiveItem.receivedUnits, po.poNumber, performedBy, session);
                    }
                }
            }
            po.status = 'received';
            po.receivedAt = new Date();
            po.totalUnitsReceived = totalReceived;
            po.totalUnitsRejected = totalRejected;
            po.chillingTempVerified = data.chillingTemp;
            po.qualityTesterName = data.qualityTesterName;
            await po.save({ session: session || undefined });
            return mapPOToDto(po);
        });
    }
}
exports.ProcurementService = ProcurementService;
exports.procurementService = new ProcurementService();
//# sourceMappingURL=procurement.service.js.map