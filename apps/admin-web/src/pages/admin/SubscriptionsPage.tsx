import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/features/subscriptions/subscriptionsApi';
import { AdminSubscription } from '@/types/subscriptions';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  CalendarDays,
  Search,
  Pause,
  Play,
  Wallet,
  MapPin,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'cancelled'>('all');
  const [selectedSub, setSelectedSub] = useState<AdminSubscription | null>(null);

  const { data: subscriptions = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: subscriptionsApi.getSubscriptions,
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.pauseSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      if (selectedSub) setSelectedSub(null);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.resumeSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      if (selectedSub) setSelectedSub(null);
    },
  });

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSearch =
      sub.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.customerPhone.includes(searchTerm) ||
      sub.items.some((it) => it.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const pausedCount = subscriptions.filter((s) => s.status === 'paused').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-emerald-600" />
            Recurring Milk Subscriptions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage daily drops, prepaid wallet thresholds, pause/resume schedules, and customer delivery requirements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1.5 text-xs">
            {activeCount} Active Recurring
          </Badge>
          <Badge variant="warning" className="px-3 py-1.5 text-xs">
            {pausedCount} Paused
          </Badge>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Search subscriber, phone, milk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            {(['all', 'active', 'paused', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load subscriptions.</Alert>
      ) : filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No subscriptions matched</p>
            <p className="text-sm mt-1">Try clearing your search query or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Milk Item & Qty</th>
                  <th className="py-3 px-4">Cadence / Schedule</th>
                  <th className="py-3 px-4">Next Drop</th>
                  <th className="py-3 px-4">Prepaid Wallet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscriptions.map((sub) => {
                  const isSufficient = sub.isWalletSufficient || sub.walletBalance >= 150;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {sub.id.toUpperCase()}
                        <div className="text-[11px] text-slate-400 font-sans font-normal">
                          Morning 5:30 AM - 7:00 AM
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{sub.customerName}</div>
                        <div className="text-xs text-slate-500">{sub.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {sub.items.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" className="capitalize text-xs font-medium">
                          {sub.frequency.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {sub.nextDeliveryDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(sub.walletBalance)}
                        </div>
                        <div className="text-[11px]">
                          {isSufficient ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Sufficient
                            </span>
                          ) : (
                            <span className="text-rose-600 font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Low Balance
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            sub.status === 'active'
                              ? 'success'
                              : sub.status === 'paused'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedSub(sub)}
                            className="text-xs"
                          >
                            View
                          </Button>
                          {sub.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => pauseMutation.mutate(sub.id)}
                              disabled={pauseMutation.isPending}
                              className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                            >
                              <Pause className="w-3 h-3 mr-1" />
                              Pause
                            </Button>
                          ) : sub.status === 'paused' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => resumeMutation.mutate(sub.id)}
                              disabled={resumeMutation.isPending}
                              className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Resume
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        title={`Subscription Details - ${selectedSub?.id.toUpperCase()}`}
      >
        {selectedSub && (
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-500 block">Subscriber</span>
                <strong className="text-slate-900">{selectedSub.customerName}</strong>
                <div className="text-xs text-slate-600">{selectedSub.customerPhone}</div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Current Status</span>
                <Badge
                  variant={
                    selectedSub.status === 'active'
                      ? 'success'
                      : selectedSub.status === 'paused'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {selectedSub.status}
                </Badge>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Schedule & Drop Preferences
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <span className="text-slate-500">Products:</span>{' '}
                  <span className="font-medium text-slate-900">
                    {selectedSub.items.map((i) => `${i.quantity}x ${i.productName} (${i.size})`).join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Cadence:</span>{' '}
                  <span className="font-medium text-slate-900 capitalize">{selectedSub.frequency}</span>
                </div>
                <div>
                  <span className="text-slate-500">Slot:</span>{' '}
                  <span className="font-medium text-slate-900">5:30 AM - 7:00 AM Morning Drop</span>
                </div>
                <div>
                  <span className="text-slate-500">Start Date:</span>{' '}
                  <span className="font-medium text-slate-900">{selectedSub.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Next Drop Date:</span>{' '}
                  <span className="font-medium text-emerald-700 font-bold">{selectedSub.nextDeliveryDate}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-1 text-xs">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Delivery Address & Pincode
              </h4>
              <p className="text-slate-800 font-medium">{selectedSub.deliveryAddress}</p>
              <p className="text-slate-500">Pincode: {selectedSub.pincode}</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between items-center text-xs">
              <div>
                <span className="text-emerald-800 font-medium block">Prepaid Balance:</span>
                <span className="text-emerald-950 font-bold text-base">{formatCurrency(selectedSub.walletBalance)}</span>
              </div>
              <div className="text-right text-emerald-700">
                <span>Deductions occur upon morning dispatch</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedSub(null)}
              >
                Close
              </Button>
              {selectedSub.status === 'active' ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => pauseMutation.mutate(selectedSub.id)}
                  className="text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  Pause Subscription
                </Button>
              ) : selectedSub.status === 'paused' ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => resumeMutation.mutate(selectedSub.id)}
                >
                  Resume Deliveries
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default SubscriptionsPage;
