import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementApi } from '@/features/procurement/procurementApi';
import { suppliersApi } from '@/features/suppliers/suppliersApi';
import { productsApi } from '@/features/products/productsApi';
import { PurchaseOrder, CreatePurchaseOrderPayload, ReceiveStockPayload } from '@/types/procurement';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  Truck,
  Plus,
  PackageCheck,
  Thermometer,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowDownLeft,
  XCircle,
} from 'lucide-react';

export const ProcurementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  // Queries
  const { data: purchaseOrders = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'purchase-orders'],
    queryFn: procurementApi.getPurchaseOrders,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['admin', 'suppliers'],
    queryFn: suppliersApi.getSuppliers,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: productsApi.getProducts,
  });

  // Create PO form state
  const [newSupplierId, setNewSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{
    productId: string;
    productName: string;
    size: '500ml' | '1L';
    packagingType: 'eco_pouch' | 'glass_bottle';
    orderedUnits: number;
    unitCost: number;
  }>>([
    {
      productId: 'prod_cow_milk',
      productName: 'Farm Fresh Cow Milk',
      size: '1L',
      packagingType: 'eco_pouch',
      orderedUnits: 400,
      unitCost: 52,
    },
  ]);

  // Receive stock form state
  const [chillingTemp, setChillingTemp] = useState<number>(3.8);
  const [qualityTester, setQualityTester] = useState('Rajesh Sharma (QC In-charge)');
  const [receiveInputs, setReceiveInputs] = useState<Record<string, { receivedUnits: number; rejectedUnits: number; rejectionReason?: string }>>({});

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) => procurementApi.createPurchaseOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'purchase-orders'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (payload: ReceiveStockPayload) => procurementApi.receiveStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      setReceivingPO(null);
    },
  });

  const resetCreateForm = () => {
    setNewSupplierId('');
    setPoNotes('');
    setPoItems([
      {
        productId: 'prod_cow_milk',
        productName: 'Farm Fresh Cow Milk',
        size: '1L',
        packagingType: 'eco_pouch',
        orderedUnits: 400,
        unitCost: 52,
      },
    ]);
  };

  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setReceivingPO(po);
    const initialInputs: Record<string, { receivedUnits: number; rejectedUnits: number; rejectionReason?: string }> = {};
    po.items.forEach((item) => {
      initialInputs[item.id] = {
        receivedUnits: item.orderedUnits,
        rejectedUnits: 0,
        rejectionReason: '',
      };
    });
    setReceiveInputs(initialInputs);
    setChillingTemp(3.8);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierId) return;

    createMutation.mutate({
      supplierId: newSupplierId,
      expectedDeliveryDate: expectedDate,
      notes: poNotes,
      items: poItems,
    });
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingPO) return;

    const payload: ReceiveStockPayload = {
      poId: receivingPO.id,
      chillingTemp: `${chillingTemp}°C`,
      qualityTesterName: qualityTester,
      items: Object.entries(receiveInputs).map(([itemId, data]) => ({
        itemId,
        receivedUnits: Number(data.receivedUnits),
        rejectedUnits: Number(data.rejectedUnits),
        rejectionReason: data.rejectedUnits > 0 ? data.rejectionReason || 'Damaged seal / transit leakage' : undefined,
      })),
    };

    receiveMutation.mutate(payload);
  };

  // Filtered list
  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesStatus = filterStatus === 'all' || po.status === filterStatus;
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-600" />
            Procurement & Packaging Output
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Order packaged milk batches from partner dairy farms, verify dock chilling temps (&le;4&deg;C), and record accepted units into saleable inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* QC Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <Thermometer className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <span className="font-semibold">Cold Chain Dock Protocol:</span> Inward batches must maintain a verified core temperature under <strong>4.0&deg;C</strong>. Accepted packaged units immediately auto-increment saleable packaged inventory. Rejected pouches or defective glass caps are routed to write-off logs.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Search PO # or Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'ordered', 'received', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load procurement orders.</Alert>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No purchase orders found</p>
            <p className="text-sm mt-1">Try adjusting your search criteria or create a new order.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Expected Date</th>
                  <th className="py-3 px-4">Packaged Units</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">QC & Temp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((po) => {
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {po.poNumber}
                        <div className="text-[11px] text-slate-400 font-sans font-normal">
                          Created {formatDate(po.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{po.supplierName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {po.expectedDeliveryDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-medium">
                          {po.totalUnitsOrdered} units
                        </div>
                        {po.status === 'received' && (
                          <div className="text-xs text-emerald-600 font-medium">
                            {po.totalUnitsReceived} received / {po.totalUnitsRejected} rejected
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {po.chillingTempVerifiedAtReceipt ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-xs">
                            <Thermometer className="w-3.5 h-3.5 text-emerald-500" />
                            {po.chillingTempVerifiedAtReceipt}
                            <span className="text-slate-400 text-[11px]">({po.qualityTesterName?.split(' ')[0]})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 italic">Pending receipt QC</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            po.status === 'received'
                              ? 'success'
                              : po.status === 'ordered'
                              ? 'info'
                              : 'danger'
                          }
                        >
                          {po.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {po.status === 'ordered' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenReceiveModal(po)}
                            className="text-xs flex items-center gap-1.5 ml-auto text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            Receive Units
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE ORDER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Milk Procurement Purchase Order"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Partner Dairy Supplier"
            required
            value={newSupplierId}
            onChange={(e) => setNewSupplierId(e.target.value)}
          >
            <option value="">-- Select Registered Supplier --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code} - {s.villageDistrict || s.location || 'Rural Dairy'})
              </option>
            ))}
          </Select>

          <Input
            label="Expected Cold Van Delivery Date"
            type="date"
            required
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Packaged Units to Procure
            </h4>
            {poItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center bg-white p-2.5 rounded border border-slate-200">
                <div className="sm:col-span-2">
                  <Select
                    label="Product & Size"
                    value={item.productId}
                    onChange={(e) => {
                      const selProd = products.find((p) => p.id === e.target.value);
                      const updated = [...poItems];
                      updated[idx].productId = e.target.value;
                      updated[idx].productName = selProd?.name || 'Milk';
                      setPoItems(updated);
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.size || '1L'})
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input
                    label="Units"
                    type="number"
                    min="1"
                    value={item.orderedUnits}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].orderedUnits = Number(e.target.value);
                      setPoItems(updated);
                    }}
                  />
                </div>
                <div>
                  <Input
                    label="Rate (₹/unit)"
                    type="number"
                    min="1"
                    value={item.unitCost}
                    onChange={(e) => {
                      const updated = [...poItems];
                      updated[idx].unitCost = Number(e.target.value);
                      setPoItems(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Input
            label="Procurement Instructions / Batch Note"
            placeholder="e.g. Ensure chilled below 4C upon dispatch"
            value={poNotes}
            onChange={(e) => setPoNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || !newSupplierId}
            >
              {createMutation.isPending ? 'Issuing PO...' : 'Issue Purchase Order'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECEIVE STOCK & QC VERIFICATION MODAL */}
      <Modal
        isOpen={Boolean(receivingPO)}
        onClose={() => setReceivingPO(null)}
        title={`Inward Receipt & QC Verification - ${receivingPO?.poNumber}`}
      >
        {receivingPO && (
          <form onSubmit={handleReceiveSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500">Supplier:</span>{' '}
                <strong className="text-slate-900">{receivingPO.supplierName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Ordered:</span>{' '}
                <strong className="text-slate-900">{receivingPO.totalUnitsOrdered} units</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Dock Core Chilling Temp (°C)"
                type="number"
                step="0.1"
                required
                value={chillingTemp}
                onChange={(e) => setChillingTemp(parseFloat(e.target.value))}
                helperText="Must be <= 4.0°C to pass intake criteria"
              />
              <Input
                label="QC Inspector Name"
                required
                value={qualityTester}
                onChange={(e) => setQualityTester(e.target.value)}
              />
            </div>

            {chillingTemp > 4.0 && (
              <Alert variant="warning" className="text-xs">
                Caution: Chilling temperature exceeds 4.0°C! Verify cold integrity before accepting batch units into physical stock.
              </Alert>
            )}

            <div className="border border-slate-200 rounded-lg p-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Unit Tally & Defect Inspection
              </h4>
              {receivingPO.items.map((item) => {
                const inputs = receiveInputs[item.id] || {
                  receivedUnits: item.orderedUnits,
                  rejectedUnits: 0,
                  rejectionReason: '',
                };

                return (
                  <div key={item.id} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                    <div className="flex justify-between font-medium text-xs text-slate-900">
                      <span>{item.productName} ({item.size} {item.packagingType})</span>
                      <span className="text-slate-500">Ordered: {item.orderedUnits}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Accepted Units"
                        type="number"
                        min="0"
                        max={item.orderedUnits}
                        value={inputs.receivedUnits}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setReceiveInputs((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              receivedUnits: val,
                              rejectedUnits: Math.max(0, item.orderedUnits - val),
                            },
                          }));
                        }}
                      />
                      <Input
                        label="Rejected Units"
                        type="number"
                        min="0"
                        value={inputs.rejectedUnits}
                        onChange={(e) => {
                          const rej = Number(e.target.value);
                          setReceiveInputs((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              rejectedUnits: rej,
                            },
                          }));
                        }}
                      />
                    </div>

                    {inputs.rejectedUnits > 0 && (
                      <Input
                        label="Rejection Reason"
                        placeholder="e.g. Broken foil seal, sour odour, leakage"
                        value={inputs.rejectionReason || ''}
                        onChange={(e) => {
                          const reason = e.target.value;
                          setReceiveInputs((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              rejectionReason: reason,
                            },
                          }));
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReceivingPO(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={receiveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {receiveMutation.isPending ? 'Recording Intake...' : 'Accept & Add to Inventory'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default ProcurementPage;
