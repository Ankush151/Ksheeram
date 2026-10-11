import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { useAuth } from '@/features/auth/AuthContext';
import { ManifestOrderItem, CompleteDeliveryPayload, FailDeliveryPayload } from '@/types/delivery';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency } from '@/utils/formatters';
import {
  ArrowLeft,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  Layers,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export const AgentOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const agentId = user?.id || 'usr_agent_1';

  // Forms state
  const [activeAction, setActiveAction] = useState<'none' | 'complete' | 'fail'>('none');
  const [completeNotes, setCompleteNotes] = useState('Left in milk drop bag on outer grill door');
  const [cashCollected, setCashCollected] = useState(true);

  const [failReason, setFailReason] = useState<'door_locked_no_drop_box' | 'customer_unreachable' | 'incorrect_address' | 'bottle_leakage' | 'other'>('door_locked_no_drop_box');
  const [failNotes, setFailNotes] = useState('');

  // Queries: fetch manifest for current agent
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['delivery', 'agent-manifest', agentId],
    queryFn: () => deliveryApi.getAgentManifest(agentId),
  });

  const orderItem = items.find((i) => i.orderId === id);

  // Mutations
  const completeMutation = useMutation({
    mutationFn: (payload: CompleteDeliveryPayload) => deliveryApi.completeDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'agent-manifest', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-manifest'] });
      navigate('/delivery/manifest');
    },
  });

  const failMutation = useMutation({
    mutationFn: (payload: FailDeliveryPayload) => deliveryApi.failDelivery(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'agent-manifest', agentId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-manifest'] });
      navigate('/delivery/manifest');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!orderItem) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => navigate('/delivery/manifest')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Manifest
        </Button>
        <Alert variant="danger">
          Delivery order #{id} not found or not assigned to your route.
        </Alert>
      </div>
    );
  }

  const isCOD = orderItem.paymentMethod === 'cod';
  const isFinished = orderItem.status === 'delivered' || orderItem.status === 'failed';
  const fullAddress =
    orderItem.customerAddress ||
    `${orderItem.flatNumber}, ${orderItem.buildingName}, ${orderItem.streetArea}, ${orderItem.pincode}`;

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeMutation.mutate({
      orderId: orderItem.orderId,
      cashCollected: cashCollected ? orderItem.amountToCollect : 0,
      agentNotes: completeNotes,
    });
  };

  const handleFailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    failMutation.mutate({
      orderId: orderItem.orderId,
      reason: failReason,
      notes: failNotes,
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Top back nav */}
      <button
        onClick={() => navigate('/delivery/manifest')}
        className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Route Manifest
      </button>

      {/* Main Order Card */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-mono text-slate-400">
                {orderItem.orderNumber}
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                {orderItem.customerName}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Slot: {orderItem.deliverySlot}
              </div>
            </div>
            <Badge
              variant={
                orderItem.status === 'delivered'
                  ? 'success'
                  : orderItem.status === 'failed'
                  ? 'danger'
                  : 'warning'
              }
              className="capitalize text-xs"
            >
              {orderItem.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Address Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Delivery Address</span>
                <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
                  {fullAddress}
                </p>
              </div>
            </div>

            {orderItem.deliveryInstructions && (
              <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-2.5 text-xs text-amber-900">
                <strong className="block text-[11px] text-amber-800 uppercase tracking-wider">
                  Customer Instructions:
                </strong>
                &ldquo;{orderItem.deliveryInstructions}&rdquo;
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" /> Open in Google Maps
              </a>
              <a
                href={`tel:${orderItem.customerPhone}`}
                className="flex-1 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call Customer
              </a>
            </div>
          </div>

          {/* Package Units Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Packaged Milk Units to Drop
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              {orderItem.items.map((it, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{it.productName}</span>
                    <span className="text-slate-500">{it.size} pack</span>
                  </div>
                  <span className="text-base font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                    &times; {it.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Notice */}
          <div className={`p-3.5 rounded-xl border text-xs ${
            isCOD
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <span className="block font-bold">
                  {isCOD ? 'Cash On Delivery Order' : 'Prepaid Subscription Drop'}
                </span>
                <span className="text-[11px] opacity-80">
                  {isCOD ? 'Collect exact change before drop' : 'Already paid online, do not collect cash'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black block">
                  {isCOD ? formatCurrency(orderItem.amountToCollect) : '₹0'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Display if already completed */}
          {isFinished && (
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 block">Status Record:</span>
              <div className="font-bold text-slate-900">
                {orderItem.status === 'delivered' ? 'Successfully Delivered' : 'Delivery Failed'}
              </div>
              {orderItem.deliveredAt && (
                <div className="text-slate-500">Delivered At: {orderItem.deliveredAt}</div>
              )}
              {orderItem.failedReason && (
                <div className="text-rose-600 font-semibold">{orderItem.failedReason}</div>
              )}
              {orderItem.agentNotes && (
                <div className="text-slate-600 italic">Notes: {orderItem.agentNotes}</div>
              )}
            </div>
          )}

          {/* Pending Delivery Action Buttons */}
          {!isFinished && activeAction === 'none' && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => setActiveAction('complete')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 flex items-center justify-center gap-1.5 font-bold shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5" /> Mark Delivered
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveAction('fail')}
                className="w-full text-rose-700 border-rose-200 hover:bg-rose-50 py-3 flex items-center justify-center gap-1.5 font-bold"
              >
                <XCircle className="w-5 h-5" /> Report Exception
              </Button>
            </div>
          )}

          {/* Inline Complete Form */}
          {!isFinished && activeAction === 'complete' && (
            <form onSubmit={handleCompleteSubmit} className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Confirm Drop Completion
              </h4>

              {isCOD && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="collectCheck"
                    checked={cashCollected}
                    onChange={(e) => setCashCollected(e.target.checked)}
                    className="rounded border-amber-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label htmlFor="collectCheck" className="text-xs font-bold text-amber-900">
                    I collected {formatCurrency(orderItem.amountToCollect)} in cash
                  </label>
                </div>
              )}

              <Input
                label="Delivery Handover Note"
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                placeholder="e.g. In porch cooler / Handed to security"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setActiveAction('none')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? 'Confirming...' : 'Confirm Delivered'}
                </Button>
              </div>
            </form>
          )}

          {/* Inline Fail Form */}
          {!isFinished && activeAction === 'fail' && (
            <form onSubmit={handleFailSubmit} className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Report Exception & Fail Drop
              </h4>

              <Select
                label="Reason"
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
                label="Additional details"
                required
                value={failNotes}
                onChange={(e) => setFailNotes(e.target.value)}
                placeholder="e.g. Ringed twice, wait time 5 mins"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setActiveAction('none')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                  disabled={failMutation.isPending}
                >
                  {failMutation.isPending ? 'Submitting...' : 'Confirm Fail'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default AgentOrderDetailPage;
