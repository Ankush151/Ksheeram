import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/inventory/inventoryApi';
import { InventoryItem, StockMovementLog, AdjustStockPayload } from '@/types/inventory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/utils/formatters';
import {
  Boxes,
  Layers,
  ShieldCheck,
  AlertTriangle,
  History,
  Sliders,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchTerm, setSearchTerm] = useState('');

  // Adjustment Modal & Confirmation state
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add_stock' | 'mark_damaged' | 'audit_adjustment'>('add_stock');
  const [adjustmentUnits, setAdjustmentUnits] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Queries
  const { data: inventory = [], isLoading: isLoadingInv } = useQuery({
    queryKey: ['admin', 'inventory'],
    queryFn: inventoryApi.getInventory,
  });

  const { data: stockLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin', 'inventory-logs'],
    queryFn: inventoryApi.getStockLogs,
  });

  // Mutation
  const adjustMutation = useMutation({
    mutationFn: (payload: AdjustStockPayload) => inventoryApi.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      setIsConfirmOpen(false);
      setAdjustingItem(null);
      setAdjustmentReason('');
    },
  });

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustmentType('mark_damaged');
    setAdjustmentUnits(2);
    setAdjustmentReason('Found pinhole leak on pouch during route loading');
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || !adjustmentReason.trim()) return;
    setIsConfirmOpen(true);
  };

  const executeConfirmedAdjustment = () => {
    if (!adjustingItem) return;
    adjustMutation.mutate({
      inventoryId: adjustingItem.id,
      adjustmentType,
      units: Number(adjustmentUnits),
      reason: adjustmentReason,
    });
  };

  // Metrics summary
  const totalPhysical = inventory.reduce((acc, i) => acc + i.physicalUnits, 0);
  const totalReserved = inventory.reduce((acc, i) => acc + i.reservedUnits, 0);
  const totalAvailable = inventory.reduce((acc, i) => acc + i.availableUnits, 0);
  const totalDamaged = inventory.reduce((acc, i) => acc + i.damagedUnits, 0);

  const filteredInventory = inventory.filter((item) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.packagingType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = stockLogs.filter((log) =>
    log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.movementType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-emerald-600" />
            Packaged Unit Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of saleable 500ml pouches and 1L glass bottles. Authoritative stock calculations are enforced via backend ledger transitions.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'current'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Stock ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail ({stockLogs.length})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Physical In Cold Room</div>
              <div className="text-xl font-bold text-slate-900">{totalPhysical} units</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Reserved for Drops</div>
              <div className="text-xl font-bold text-amber-700">{totalReserved} units</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Net Available to Sell</div>
              <div className="text-xl font-bold text-emerald-700">{totalAvailable} units</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Damaged / Rejected</div>
              <div className="text-xl font-bold text-rose-700">{totalDamaged} units</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="Search product name or packaging..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="hidden sm:flex text-xs text-slate-400 items-center gap-1.5 ml-auto">
            <Info className="w-4 h-4" />
            <span>Reserved stock is locked by tomorrow's active subscriptions and orders</span>
          </div>
        </CardContent>
      </Card>

      {/* Tab: CURRENT STOCK */}
      {activeTab === 'current' && (
        <>
          {isLoadingInv ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Product & Pack</th>
                      <th className="py-3 px-4">Physical</th>
                      <th className="py-3 px-4">Reserved</th>
                      <th className="py-3 px-4">Available</th>
                      <th className="py-3 px-4">Damaged</th>
                      <th className="py-3 px-4">Threshold</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4 text-right">Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => {
                      const isLow = item.availableUnits <= item.reorderLevel;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>{item.size}</span>
                              <span>&bull;</span>
                              <span className="font-mono">{item.packagingType}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {item.physicalUnits}
                          </td>
                          <td className="py-3.5 px-4 text-amber-700 font-medium">
                            {item.reservedUnits}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {item.availableUnits}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-rose-600 font-medium">
                            {item.damagedUnits}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            Reorder @ {item.reorderLevel}
                          </td>
                          <td className="py-3.5 px-4">
                            {isLow ? (
                              <Badge variant="danger" className="animate-pulse">
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success">Healthy</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenAdjust(item)}
                              className="text-xs flex items-center gap-1.5 ml-auto text-slate-700 hover:text-slate-900"
                            >
                              <Sliders className="w-3.5 h-3.5 text-slate-500" />
                              Adjust
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: MOVEMENT AUDIT TRAIL */}
      {activeTab === 'history' && (
        <>
          {isLoadingLogs ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Delta Units</th>
                      <th className="py-3 px-4">Balance After</th>
                      <th className="py-3 px-4">Reason / Reference</th>
                      <th className="py-3 px-4">Auditor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {filteredLogs.map((log) => {
                      const isPositive = log.deltaUnits > 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-sans text-slate-500">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-900">
                            {log.productName} ({log.size})
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <Badge
                              variant={
                                log.movementType === 'procurement_inward'
                                  ? 'success'
                                  : log.movementType === 'damage_spoilage'
                                  ? 'danger'
                                  : 'neutral'
                              }
                            >
                              {log.movementType.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                              {isPositive ? `+${log.deltaUnits}` : log.deltaUnits}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                            {log.balanceAfter}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                            {log.reason} {log.referenceId ? `(${log.referenceId})` : ''}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-500">
                            {log.performedBy}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADJUSTMENT MODAL */}
      <Modal
        isOpen={Boolean(adjustingItem) && !isConfirmOpen}
        onClose={() => setAdjustingItem(null)}
        title={`Stock Adjustment - ${adjustingItem?.productName} (${adjustingItem?.size})`}
      >
        {adjustingItem && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-500 block">Physical</span>
                <strong className="text-slate-900 text-sm">{adjustingItem.physicalUnits}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Reserved</span>
                <strong className="text-amber-700 text-sm">{adjustingItem.reservedUnits}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Available</span>
                <strong className="text-emerald-700 text-sm">{adjustingItem.availableUnits}</strong>
              </div>
            </div>

            <Select
              label="Adjustment Category"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as any)}
            >
              <option value="mark_damaged">Mark as Damaged / Leaked Pouch (Reduces physical, increments damaged)</option>
              <option value="add_stock">Add Physical Stock (Discrepancy / Found surplus)</option>
              <option value="audit_adjustment">Set Exact Physical Balance (Routine cold room count)</option>
            </Select>

            <Input
              label={
                adjustmentType === 'audit_adjustment'
                  ? 'New Exact Physical Unit Count'
                  : 'Number of Units'
              }
              type="number"
              min="1"
              required
              value={adjustmentUnits}
              onChange={(e) => setAdjustmentUnits(Number(e.target.value))}
            />

            <Input
              label="Mandatory Audit Justification & Reason"
              placeholder="e.g. Broken seal during morning loading; routed to scrap"
              required
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              helperText="All manual adjustments are permanently logged with auditor attribution."
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAdjustingItem(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Review & Confirm
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        title="Confirm Authoritative Stock Adjustment"
        message={`Are you sure you want to record ${adjustmentType.replace('_', ' ')} of ${adjustmentUnits} units for "${adjustingItem?.productName}"? This change immediately takes effect on delivery allocation and stock reporting.`}
        confirmText="Confirm Ledger Adjustment"
        confirmVariant={adjustmentType === 'mark_damaged' ? 'danger' : 'primary'}
        isPending={adjustMutation.isPending}
        onConfirm={executeConfirmedAdjustment}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
export default InventoryPage;
