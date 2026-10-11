import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { useAuth } from '@/features/auth/AuthContext';
import { ManifestOrderItem, CompleteDeliveryPayload, FailDeliveryPayload } from '@/types/delivery';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency } from '@/utils/formatters';
import {
  Bike,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  PackageCheck,
  AlertTriangle,
  IndianRupee,
  Navigation,
} from 'lucide-react';

export const AgentManifestPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const agentId = user?.id || 'usr_agent_1';

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // Modals for quick delivery actions
  const [completingItem, setCompletingItem] = useState<ManifestOrderItem | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [cashCollected, setCashCollected] = useState(true);

  const [failingItem, setFailingItem] = useState<ManifestOrderItem | null>(null);
  const [failReason, setFailReason] = useState<'door_locked_no_drop_box' | 'customer_unreachable' | 'incorrect_address' | 'bottle_leakage' | 'other'>('door_locked_no_drop_box');
  const [failNotes, setFailNotes] = useState('');

  // Queries
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['delivery', 'agent-manifest', agentId],
    queryFn: () => deliveryApi.getAgentManifest(agentId),
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (payload: CompleteDeliveryPayload) => deliveryApi.completeDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'agent-manifest', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-manifest'] });
      setCompletingItem(null);
      setCompleteNotes('');
    },
  });

  // Fail mutation
  const failMutation = useMutation({
    mutationFn: (payload: FailDeliveryPayload) => deliveryApi.failDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'agent-manifest', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-manifest'] });
      setFailingItem(null);
      setFailNotes('');
    },
  });

  const getAddress = (m: ManifestOrderItem) =>
    m.customerAddress || `${m.flatNumber}, ${m.buildingName}, ${m.streetArea}`;

  const pendingItems = items.filter((i) => i.status === 'assigned' || i.status === 'out_for_delivery');
  const completedItems = items.filter((i) => i.status === 'delivered' || i.status === 'failed');

  const displayedItems = activeTab === 'pending' ? pendingItems : completedItems;

  const handleOpenComplete = (item: ManifestOrderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletingItem(item);
    setCompleteNotes('Dropped at milk bag on door hook');
    setCashCollected(item.paymentMethod === 'cod');
  };

  const handleOpenFail = (item: ManifestOrderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setFailingItem(item);
    setFailReason('door_locked_no_drop_box');
    setFailNotes('Called twice; phone switched off');
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingItem) return;
    completeMutation.mutate({
      orderId: completingItem.orderId,
      cashCollected: cashCollected ? completingItem.amountToCollect : 0,
      agentNotes: completeNotes,
    });
  };

  const handleFailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failingItem) return;
    failMutation.mutate({
      orderId: failingItem.orderId,
      reason: failReason,
      notes: failNotes,
    });
  };

  return (
    <div className="space-y-4">
      {/* Route Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-emerald-200 text-xs font-semibold tracking-wider uppercase">
              Morning Delivery Manifest
            </span>
            <h1 className="text-xl font-bold mt-0.5">Assigned Route Drops</h1>
            <p className="text-xs text-emerald-100 mt-1">
              Agent: <strong>{user?.name || 'Ramesh Kumar'}</strong> &bull; {user?.assignedRoute || 'Sector 1'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{pendingItems.length}</span>
            <span className="text-xs text-emerald-200 block">Drops Remaining</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-emerald-600/60">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors text-center ${
              activeTab === 'pending'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            Pending ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors text-center ${
              activeTab === 'completed'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-800'
            }`}
          >
            Completed ({completedItems.length})
          </button>
        </div>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load assigned deliveries.</Alert>
      ) : displayedItems.length === 0 ? (
        <Card className="bg-white border-dashed border-2 border-slate-200">
          <CardContent className="p-10 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
            <p className="font-bold text-slate-800">
              {activeTab === 'pending' ? 'All Deliveries Completed!' : 'No completed drops yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'pending'
                ? 'Great job! Hand over COD cash bags to supervisor at depot.'
                : 'Deliveries marked complete or failed will show here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedItems.map((item, idx) => {
            const isCOD = item.paymentMethod === 'cod';
            return (
              <Card
                key={item.orderId}
                className="bg-white border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                onClick={() => navigate(`/delivery/orders/${item.orderId}`)}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Top line: Drop #, Customer, Slot */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">
                          {item.customerName}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.orderNumber}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        item.status === 'delivered'
                          ? 'success'
                          : item.status === 'failed'
                          ? 'danger'
                          : 'warning'
                      }
                      className="capitalize text-[11px]"
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{getAddress(item)}</span>
                  </div>

                  {/* Items to deliver */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {item.items.map((it, i) => (
                      <span
                        key={i}
                        className="bg-emerald-50 text-emerald-900 font-medium px-2 py-1 rounded-md border border-emerald-100"
                      >
                        {it.quantity}&times; {it.productName} ({it.size})
                      </span>
                    ))}
                  </div>

                  {/* Payment & instructions */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div>
                      {isCOD ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                          Collect Cash: {formatCurrency(item.amountToCollect)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Prepaid (Don't collect)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-slate-400 text-xs">
                      Details <ChevronRight className="w-4 h-4 ml-0.5" />
                    </div>
                  </div>

                  {/* Action buttons if pending */}
                  {activeTab === 'pending' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => handleOpenComplete(item, e)}
                        className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 py-2 flex items-center justify-center gap-1.5 font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Delivered
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => handleOpenFail(item, e)}
                        className="w-full text-xs text-rose-700 border-rose-200 hover:bg-rose-50 py-2 flex items-center justify-center gap-1.5 font-bold"
                      >
                        <XCircle className="w-4 h-4" /> Fail Drop
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* QUICK COMPLETE MODAL */}
      <Modal
        isOpen={Boolean(completingItem)}
        onClose={() => setCompletingItem(null)}
        title={`Confirm Drop - ${completingItem?.customerName}`}
      >
        {completingItem && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">{getAddress(completingItem)}</div>
              <div className="text-slate-600">
                Units: {completingItem.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
              </div>
            </div>

            {completingItem.paymentMethod === 'cod' ? (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cashCheck"
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                  className="rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="cashCheck" className="text-xs font-bold text-amber-900">
                  Cash Collected: {formatCurrency(completingItem.amountToCollect)}
                </label>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                Prepaid Subscription Drop (No cash collection needed)
              </div>
            )}

            <Input
              label="Drop Location Note"
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="e.g. In milk bag on doorstep / handed to resident"
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCompletingItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={completeMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {completeMutation.isPending ? 'Submitting...' : 'Mark Drop Completed'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* QUICK FAIL MODAL */}
      <Modal
        isOpen={Boolean(failingItem)}
        onClose={() => setFailingItem(null)}
        title={`Report Delivery Exception - ${failingItem?.customerName}`}
      >
        {failingItem && (
          <form onSubmit={handleFailSubmit} className="space-y-4">
            <Select
              label="Select Exception Reason"
              value={failReason}
              onChange={(e) => setFailReason(e.target.value as any)}
            >
              <option value="door_locked_no_drop_box">Door locked / Customer not home</option>
              <option value="customer_unreachable">Customer phone unreachable / switched off</option>
              <option value="incorrect_address">Address not found / gate security refused entry</option>
              <option value="bottle_leakage">Package defect or leakage found</option>
              <option value="other">Other operational exception</option>
            </Select>

            <Input
              label="Details / Action Attempted"
              required
              value={failNotes}
              onChange={(e) => setFailNotes(e.target.value)}
              placeholder="e.g. Rang doorbell 3 times, called 98765..."
            />

            <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              This drop will be flagged to supervisor operations and customer support.
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFailingItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={failMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {failMutation.isPending ? 'Recording...' : 'Submit Exception'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default AgentManifestPage;
