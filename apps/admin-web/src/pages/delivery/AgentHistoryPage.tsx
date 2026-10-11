import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '@/features/delivery/deliveryApi';
import { useAuth } from '@/features/auth/AuthContext';
import { ManifestOrderItem } from '@/types/delivery';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  History,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Clock,
  Layers,
  MapPin,
  Calendar,
} from 'lucide-react';

export const AgentHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const agentId = user?.id || 'usr_agent_1';

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['delivery', 'agent-manifest', agentId],
    queryFn: () => deliveryApi.getAgentManifest(agentId),
  });

  const getAddress = (m: ManifestOrderItem) =>
    m.customerAddress || `${m.flatNumber}, ${m.buildingName}, ${m.streetArea}`;

  const completedItems = items.filter((i) => i.status === 'delivered' || i.status === 'failed');
  const deliveredCount = items.filter((i) => i.status === 'delivered').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  const totalCashCollected = items
    .filter((i) => i.status === 'delivered' && i.paymentMethod === 'cod')
    .reduce((acc, i) => acc + i.amountToCollect, 0);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          Shift History & Cash Summary
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review delivered drops and reconcile total COD cash collected before depot sign-off.
        </p>
      </div>

      {/* Cash Bag Summary Card */}
      <Card className="bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm border-0">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-100 uppercase tracking-wider font-semibold">
              COD Cash In Hand
            </span>
            <span className="text-xs bg-amber-800/80 px-2 py-0.5 rounded font-mono">
              Ready for Handover
            </span>
          </div>
          <div className="text-2xl font-black">
            {formatCurrency(totalCashCollected)}
          </div>
          <p className="text-[11px] text-amber-100">
            Hand over this cash amount to the dispatch manager at the central chilling hub.
          </p>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Delivered</div>
              <div className="text-lg font-bold text-slate-900">{deliveredCount} drops</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Exceptions / Failed</div>
              <div className="text-lg font-bold text-rose-700">{failedCount} drops</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drop History List */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Completed Route Log
        </h3>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spinner size="md" />
          </div>
        ) : completedItems.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-8 text-center text-slate-500 text-xs">
              No completed deliveries logged for this shift yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {completedItems.map((item) => {
              const isDelivered = item.status === 'delivered';
              return (
                <div
                  key={item.orderId}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-sm text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.customerName}</span>
                      <span className="text-[11px] font-mono text-slate-400">{item.orderNumber}</span>
                    </div>
                    <Badge variant={isDelivered ? 'success' : 'danger'}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{getAddress(item)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500">
                      {item.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </span>
                    {item.paymentMethod === 'cod' && isDelivered ? (
                      <span className="text-amber-800 font-bold">
                        Collected {formatCurrency(item.amountToCollect)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Prepaid</span>
                    )}
                  </div>

                  {item.agentNotes && (
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                      Note: {item.agentNotes}
                    </div>
                  )}

                  {item.failedReason && (
                    <div className="text-[11px] text-rose-600 font-semibold bg-rose-50 p-2 rounded border border-rose-100">
                      Exception: {item.failedReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default AgentHistoryPage;
