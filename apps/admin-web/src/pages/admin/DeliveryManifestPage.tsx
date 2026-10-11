import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { ManifestOrderItem, AssignAgentPayload } from '@/types/delivery';
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
  Bike,
  UserCheck,
  MapPin,
  Clock,
  Phone,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const DeliveryManifestPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('2026-10-11');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Queries
  const { data: manifest = [], isLoading: isLoadingManifest } = useQuery({
    queryKey: ['admin', 'delivery-manifest'],
    queryFn: deliveryApi.getDeliveryManifest,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['admin', 'delivery-agents'],
    queryFn: deliveryApi.getDeliveryAgents,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (payload: AssignAgentPayload) => deliveryApi.assignAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-manifest'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      setAssignModalOpen(false);
      setSelectedOrderIds([]);
      setSelectedAgentId('');
    },
  });

  // Progress metrics
  const totalDeliveries = manifest.length;
  const deliveredCount = manifest.filter((m) => m.status === 'delivered').length;
  const failedCount = manifest.filter((m) => m.status === 'failed').length;
  const inProgressCount = manifest.filter((m) => m.status === 'out_for_delivery').length;
  const assignedPending = manifest.filter((m) => m.status === 'assigned').length;

  const completionPct = totalDeliveries > 0 ? Math.round((deliveredCount / totalDeliveries) * 100) : 0;

  // Filtered manifest
  const filteredManifest = manifest.filter((m) => {
    const matchesDate = !selectedDate || m.deliveryDate === selectedDate;
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredManifest.map((m) => m.orderId));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId || selectedOrderIds.length === 0) return;
    assignMutation.mutate({
      orderIds: selectedOrderIds,
      agentId: selectedAgentId,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bike className="w-7 h-7 text-emerald-600" />
            Delivery Manifest & Route Dispatch
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign morning delivery batches to route agents, monitor drop progress, and resolve delivery exceptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedOrderIds.length > 0 && (
            <Button
              variant="primary"
              onClick={() => setAssignModalOpen(true)}
              className="flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700"
            >
              <UserCheck className="w-4 h-4" />
              Assign {selectedOrderIds.length} Selected
            </Button>
          )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="bg-white p-3">
          <div className="text-xs text-slate-500 font-medium">Total Manifest Drops</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalDeliveries}</div>
        </Card>
        <Card className="bg-white p-3">
          <div className="text-xs text-slate-500 font-medium">Assigned / Queued</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{assignedPending}</div>
        </Card>
        <Card className="bg-white p-3">
          <div className="text-xs text-slate-500 font-medium">Out On Route</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{inProgressCount}</div>
        </Card>
        <Card className="bg-white p-3">
          <div className="text-xs text-slate-500 font-medium">Successfully Dropped</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{deliveredCount}</div>
        </Card>
        <Card className="bg-white p-3">
          <div className="text-xs text-slate-500 font-medium">Failed / Unreachable</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{failedCount}</div>
        </Card>
      </div>

      {/* Live Route Progress Bar */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-700">Route Completion Rate</span>
            <span className="text-emerald-700 font-bold">{completionPct}% ({deliveredCount}/{totalDeliveries} drops)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(deliveredCount / (totalDeliveries || 1)) * 100}%` }}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${(inProgressCount / (totalDeliveries || 1)) * 100}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${(failedCount / (totalDeliveries || 1)) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Delivered</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> On Route</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Failed</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-44 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            {['all', 'assigned', 'out_for_delivery', 'delivered', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manifest Table */}
      {isLoadingManifest ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : filteredManifest.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <Bike className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No manifest items found for this date/status</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedOrderIds.length > 0 &&
                        selectedOrderIds.length === filteredManifest.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="py-3 px-4">Order / Drop</th>
                  <th className="py-3 px-4">Customer & Location</th>
                  <th className="py-3 px-4">Assigned Agent</th>
                  <th className="py-3 px-4">Milk Packages</th>
                  <th className="py-3 px-4">Payment Collect</th>
                  <th className="py-3 px-4">Status & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredManifest.map((item) => {
                  const isChecked = selectedOrderIds.includes(item.orderId);
                  return (
                    <tr
                      key={item.orderId}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleOrder(item.orderId)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {item.orderNumber}
                        <div className="text-[11px] text-slate-400 font-sans">{item.deliverySlot}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.customerName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-xs">{item.customerAddress}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.assignedAgentName ? (
                          <div className="text-slate-900 font-medium text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {item.assignedAgentName}
                          </div>
                        ) : (
                          <span className="text-xs text-rose-600 italic font-medium">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                        {item.items.map((it) => `${it.quantity}x ${it.productName} (${it.size})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {item.paymentMethod === 'cod' ? (
                          <span className="text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded">
                            COD: {formatCurrency(item.amountToCollect)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Prepaid / Online</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            item.status === 'delivered'
                              ? 'success'
                              : item.status === 'out_for_delivery'
                              ? 'warning'
                              : item.status === 'failed'
                              ? 'danger'
                              : 'neutral'
                          }
                          className="capitalize text-[11px]"
                        >
                          {item.status.replace('_', ' ')}
                        </Badge>
                        {item.failedReason && (
                          <div className="text-[11px] text-rose-600 font-medium mt-1">
                            Reason: {item.failedReason}
                          </div>
                        )}
                        {item.agentNotes && !item.failedReason && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Note: {item.agentNotes}
                          </div>
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

      {/* ASSIGN TO AGENT MODAL */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign ${selectedOrderIds.length} Orders to Route Partner`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <Select
            label="Select Delivery Partner"
            required
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            <option value="">-- Choose Agent --</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.phone}) - {ag.vehicleNumber} [Route: {ag.assignedSector}]
              </option>
            ))}
          </Select>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
            Assigned agents will immediately see these orders on their mobile manifest screen with full delivery addresses and cash collection targets.
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={assignMutation.isPending || !selectedAgentId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Confirm Route Assignment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default DeliveryManifestPage;
