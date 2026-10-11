import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useSubscription,
  useModifySubscription,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
} from '@/features/subscriptions/useSubscriptions';
import { formatINR, formatDate, formatSchedule } from '@/utils/formatters';
import { SubscriptionFrequency } from '@/types/subscriptions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { QuantitySelector } from '@/components/common/QuantitySelector';
import { FrequencySelector } from '@/components/common/FrequencySelector';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Pause,
  Play,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: subscription, isLoading, isError, refetch } = useSubscription(id);

  const modifyMutation = useModifySubscription();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const cancelMutation = useCancelSubscription();

  // Local state for modifications
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editFrequency, setEditFrequency] = useState<SubscriptionFrequency>('daily');
  const [editCustomDays, setEditCustomDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [effectiveDate, setEffectiveDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [serverFeedback, setServerFeedback] = useState<{
    message: string;
    affectsNextDelivery: boolean;
  } | null>(null);

  // Pause Modal
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [pauseStartDate, setPauseStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [pauseEndDate, setPauseEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  // Cancel Dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Relocating to new address');

  // Sync edit form with subscription data
  useEffect(() => {
    if (subscription) {
      setEditQuantity(subscription.items[0]?.quantity || 1);
      setEditFrequency(subscription.frequency);
      setEditCustomDays(subscription.customDays || [1, 2, 3, 4, 5, 6, 0]);
    }
  }, [subscription]);

  if (isLoading) {
    return <LoadingState message="Fetching subscription plan details..." />;
  }

  if (isError || !subscription) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          title="Subscription not found"
          message="We could not find the specified subscription record."
          onRetry={() => refetch()}
        />
        <div className="text-center mt-4">
          <Link to="/subscriptions">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Subscriptions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstItem = subscription.items[0];
  const isActive = subscription.status === 'active';
  const isPaused = subscription.status === 'paused';
  const isCancelled = subscription.status === 'cancelled';

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const res = await modifyMutation.mutateAsync({
        id,
        payload: {
          requestedQuantity: editQuantity,
          requestedFrequency: editFrequency,
          requestedCustomDays: editFrequency === 'custom' ? editCustomDays : undefined,
          effectiveDate,
        },
      });

      setServerFeedback({
        message: res.message,
        affectsNextDelivery: res.affectsNextDelivery,
      });
      setIsEditing(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to modify subscription.');
    }
  };

  const handlePause = async () => {
    if (!id) return;
    await pauseMutation.mutateAsync({
      id,
      payload: { pauseStartDate, resumeDate: pauseEndDate },
    });
    setIsPauseOpen(false);
  };

  const handleResume = async () => {
    if (!id) return;
    await resumeMutation.mutateAsync(id);
  };

  const handleCancel = async () => {
    if (!id) return;
    await cancelMutation.mutateAsync({ id, reason: cancelReason });
    setIsCancelOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <Link
        to="/subscriptions"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Subscriptions</span>
      </Link>

      {/* Header and Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              {firstItem?.productName || 'Milk Plan'}
            </h1>
            <Badge
              variant={isActive ? 'emerald' : isPaused ? 'warning' : 'danger'}
              size="md"
              dot
            >
              {subscription.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Subscription #{subscription.id} • Cutoff: {subscription.cutoffTime}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isActive && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPauseOpen(true)}
              leftIcon={<Pause className="w-3.5 h-3.5" />}
            >
              Pause Drops
            </Button>
          )}

          {isPaused && (
            <Button
              variant="primary"
              size="sm"
              isLoading={resumeMutation.isPending}
              onClick={handleResume}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              Resume Deliveries
            </Button>
          )}

          {!isCancelled && (
            <Button
              variant="outline"
              size="sm"
              className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
              onClick={() => setIsCancelOpen(true)}
            >
              Cancel Plan
            </Button>
          )}
        </div>
      </div>

      {/* Server confirmation feedback banner */}
      {serverFeedback && (
        <Alert
          variant={serverFeedback.affectsNextDelivery ? 'success' : 'warning'}
          title="Server Modification Confirmed"
        >
          {serverFeedback.message}
        </Alert>
      )}

      {/* Main Details and Edit Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Summary Card */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Plan Specifications</h3>
              {!isCancelled && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs"
                >
                  Edit Quantity &amp; Schedule
                </Button>
              )}
            </div>

            {/* Display Mode */}
            {!isEditing ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Packaging Size</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {firstItem?.size}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Quantity per Morning</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {firstItem?.quantity} drop(s)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Schedule Frequency</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                      {formatSchedule(subscription.frequency, subscription.customDays)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Next Delivery</span>
                    <span className="font-bold text-brand-700 text-sm mt-0.5 block">
                      {formatDate(subscription.nextDeliveryDate)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-emerald-900 font-semibold">Monthly Estimated Total:</span>
                  <span className="text-base font-extrabold text-emerald-900">
                    {formatINR(subscription.monthlyEstimate)}
                  </span>
                </div>
              </div>
            ) : (
              /* Inline Edit Mode */
              <form onSubmit={handleSaveChanges} className="space-y-5 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Quantity per Morning Drop
                  </label>
                  <QuantitySelector
                    value={editQuantity}
                    onChange={setEditQuantity}
                    min={1}
                    max={10}
                    size="md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Change Delivery Frequency
                  </label>
                  <FrequencySelector
                    frequency={editFrequency}
                    customDays={editCustomDays}
                    onChangeFrequency={setEditFrequency}
                    onChangeCustomDays={setEditCustomDays}
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    label="Requested Effective Date"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    hint="Backend determines whether changes affect tomorrow's delivery based on 8:00 PM cutoff."
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={modifyMutation.isPending}
                  >
                    Submit Modification to Backend
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right: Delivery Address and Service Notes */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Delivery Location</h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-slate-900">
                  {subscription.deliveryAddress?.label} Address
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {subscription.deliveryAddress?.flatNumber}, {subscription.deliveryAddress?.buildingName}
                <br />
                {subscription.deliveryAddress?.streetArea}
                <br />
                {subscription.deliveryAddress?.city} — {subscription.deliveryAddress?.pincode}
              </p>

              {subscription.deliveryAddress?.deliveryInstructions && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60">
                  <strong>Rider Instructions:</strong>{' '}
                  {subscription.deliveryAddress.deliveryInstructions}
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 space-y-1 text-xs text-brand-900">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-600" />
                <span>Cold Chain &amp; Quality Protocol</span>
              </div>
              <p className="text-[11px] text-brand-800 leading-relaxed">
                Sterilized bottles are collected during your next morning drop. Leave empty bottles near your doorstep inside the crate.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Pause Modal */}
      <Modal
        isOpen={isPauseOpen}
        onClose={() => setIsPauseOpen(false)}
        title="Pause Subscription Deliveries"
        description="Select your pause period. Deliveries will stop temporarily and automatically resume on the chosen date."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Pause From"
            type="date"
            value={pauseStartDate}
            onChange={(e) => setPauseStartDate(e.target.value)}
            required
          />
          <Input
            label="Resume Deliveries On"
            type="date"
            value={pauseEndDate}
            onChange={(e) => setPauseEndDate(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setIsPauseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={pauseMutation.isPending}
              onClick={handlePause}
            >
              Confirm Vacation Pause
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Milk Subscription?"
        description="Are you sure you want to cancel this recurring delivery plan? Any unspent wallet balance will remain securely in your account."
        confirmText="Yes, Cancel Plan"
        cancelText="Keep Subscription"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
