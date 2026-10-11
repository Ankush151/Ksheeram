import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useSubscriptions,
  usePauseSubscription,
  useResumeSubscription,
} from '@/features/subscriptions/useSubscriptions';
import { formatINR, formatDate, formatSchedule } from '@/utils/formatters';
import { Subscription } from '@/types/subscriptions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Calendar,
  Clock,
  MapPin,
  Pause,
  Play,
  Settings,
  Plus,
  AlertCircle,
  Truck,
  Droplet,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const SubscriptionsPage: React.FC = () => {
  const { data: subscriptions, isLoading, isError, refetch } = useSubscriptions();
  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const navigate = useNavigate();

  // Pause modal state
  const [selectedSubForPause, setSelectedSubForPause] = useState<Subscription | null>(null);
  const [pauseStartDate, setPauseStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [resumeDate, setResumeDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  const handleConfirmPause = async () => {
    if (!selectedSubForPause) return;
    await pauseMutation.mutateAsync({
      id: selectedSubForPause.id,
      payload: { pauseStartDate, resumeDate },
    });
    setSelectedSubForPause(null);
  };

  const handleResume = async (id: string) => {
    await resumeMutation.mutateAsync(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="emerald" dot>
            Active &amp; Delivering
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="warning" dot>
            Paused
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="danger" dot>
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald" size="md">
            Morning Milk Delivery
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
            My Milk Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your daily milk quantities, pause while on vacation, or change delivery schedules.
          </p>
        </div>

        <Link to="/products">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            New Subscription
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching active subscription schedules..." />
      ) : isError ? (
        <ErrorState
          title="Could not load subscriptions"
          message="Please ensure backend API or mock mode is enabled."
          onRetry={() => refetch()}
        />
      ) : subscriptions && subscriptions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No active milk subscriptions"
          description="Start receiving pure, farm-fresh milk every morning at your doorstep before 7:00 AM."
          actionText="Browse Milk Plans"
          onAction={() => navigate('/products')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions?.map((sub) => {
            const firstItem = sub.items[0];
            const isPaused = sub.status === 'paused';
            const isActive = sub.status === 'active';

            return (
              <Card
                key={sub.id}
                hoverEffect
                className="p-6 space-y-5 border border-slate-200/80 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar with Status and ID */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(sub.status)}
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {sub.id}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                        {firstItem?.productName || 'Farm Fresh Milk'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Package: <strong className="text-slate-800">{firstItem?.size}</strong> • Quantity:{' '}
                        <strong className="text-slate-800">{firstItem?.quantity} drop(s)</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Per Drop</span>
                      <span className="text-base font-extrabold text-brand-700">
                        {formatINR((firstItem?.unitPrice || 70) * (firstItem?.quantity || 1))}
                      </span>
                    </div>
                  </div>

                  {/* Schedule Details Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        <span>Frequency:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatSchedule(sub.frequency, sub.customDays)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                        <span>Next Delivery:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {isPaused
                          ? `Resuming on ${formatDate(sub.nextDeliveryDate)}`
                          : formatDate(sub.nextDeliveryDate)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 mt-0.5" />
                        <span>Address:</span>
                      </span>
                      <span className="font-medium text-slate-700 text-right max-w-[200px] truncate">
                        {sub.deliveryAddress?.flatNumber}, {sub.deliveryAddress?.buildingName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link to={`/subscriptions/${sub.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      leftIcon={<Settings className="w-3.5 h-3.5" />}
                    >
                      Manage Plan
                    </Button>
                  </Link>

                  {isActive && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedSubForPause(sub)}
                      leftIcon={<Pause className="w-3.5 h-3.5" />}
                    >
                      Pause
                    </Button>
                  )}

                  {isPaused && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs"
                      isLoading={resumeMutation.isPending}
                      onClick={() => handleResume(sub.id)}
                      leftIcon={<Play className="w-3.5 h-3.5" />}
                    >
                      Resume
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pause Subscription Modal */}
      <Modal
        isOpen={!!selectedSubForPause}
        onClose={() => setSelectedSubForPause(null)}
        title="Pause Milk Deliveries"
        description="Traveling or away? Pause your morning drops and resume automatically on your chosen date without losing your milk allotment."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Pause From (Start Date)"
            type="date"
            value={pauseStartDate}
            onChange={(e) => setPauseStartDate(e.target.value)}
            required
          />

          <Input
            label="Resume Deliveries On"
            type="date"
            value={resumeDate}
            onChange={(e) => setResumeDate(e.target.value)}
            hint="Milk drop will resume before 7:00 AM on this morning."
            required
          />

          <div className="p-3 rounded-xl bg-amber-50 text-xs text-amber-900 border border-amber-200">
            <strong>Cutoff Notice:</strong> Pauses requested before 8:00 PM take effect tomorrow morning. Deliveries already packed after 8:00 PM will proceed.
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedSubForPause(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={pauseMutation.isPending}
              onClick={handleConfirmPause}
            >
              Confirm Vacation Pause
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
