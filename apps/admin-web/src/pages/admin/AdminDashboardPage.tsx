import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/features/dashboard/dashboardApi';
import { formatINR } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  PackageCheck,
  TrendingUp,
  Boxes,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getDashboardStats(),
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" label="Compiling live morning operations data..." />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Alert variant="error" title="Dashboard Error">
        Could not load live operational metrics. Please check API connection.
      </Alert>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
            Morning Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time delivery progress, stock allocation, and tomorrow's procurement demand.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/deliveries">
            <Button variant="primary" size="sm" leftIcon={<Truck className="w-4 h-4" />}>
              View Live Manifest
            </Button>
          </Link>
          <Link to="/admin/procurement">
            <Button variant="outline" size="sm" leftIcon={<PackageCheck className="w-4 h-4" />}>
              Receive PO Stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner (if any unallocated orders or low stock) */}
      {stats.ordersAwaitingStockAllocation > 0 && (
        <Alert variant="warning" title="Stock Allocation Action Required">
          There are <strong>{stats.ordersAwaitingStockAllocation} order(s)</strong> scheduled for today's drops awaiting physical stock allocation.
          <Link to="/admin/orders" className="underline font-bold ml-2">
            Allocate Stock Now →
          </Link>
        </Alert>
      )}

      {/* 4 Primary Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Scheduled Drops</span>
            <Calendar className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
            {stats.todayScheduledOrders}
          </div>
          <p className="text-[11px] text-slate-500">Across Bengaluru morning sectors</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Deliveries In-Progress</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-700 font-serif">
            {stats.deliveries.inProgress} / {stats.deliveries.total}
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="text-emerald-700 font-bold">{stats.deliveries.completed} Delivered</span>
            <span className="text-rose-600 font-bold">• {stats.deliveries.failed} Failed</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Awaiting Allocation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-serif">
            {stats.ordersAwaitingStockAllocation}
          </div>
          <p className="text-[11px] text-slate-500">Scheduled drops needing pack verify</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Payment Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 font-serif">
            {stats.paymentReconciliationAlerts}
          </div>
          <Link to="/admin/payments" className="text-[11px] text-rose-600 underline font-semibold">
            Reconcile Cash &amp; Gateway →
          </Link>
        </Card>
      </div>

      {/* Main Grid: Available Packaged Stock & Tomorrow Demand Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Packaged Stock by Product */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Available Packaged Stock by Product (Units)
                </h3>
              </div>
              <Link to="/admin/inventory" className="text-xs text-brand-700 font-bold hover:underline">
                Manage Stock →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Product &amp; Package</th>
                    <th className="p-2.5 text-right">Physical Units</th>
                    <th className="p-2.5 text-right">Reserved Drops</th>
                    <th className="p-2.5 text-right">Available Saleable</th>
                    <th className="p-2.5 text-right">Damaged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.packagedStock.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-800">
                        {item.productName} ({item.size})
                      </td>
                      <td className="p-2.5 text-right font-medium text-slate-600">
                        {item.physical}
                      </td>
                      <td className="p-2.5 text-right font-medium text-amber-700">
                        {item.reserved}
                      </td>
                      <td className="p-2.5 text-right font-bold text-brand-700">
                        {item.available}
                      </td>
                      <td className="p-2.5 text-right font-medium text-rose-600">
                        {item.damaged}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Low Stock Warnings */}
          {stats.lowStockWarnings.length > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Packaged Stock Warnings ({stats.lowStockWarnings.length})</span>
              </div>
              <div className="space-y-1.5 text-xs text-amber-800">
                {stats.lowStockWarnings.map((warn, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/80 p-2 rounded-lg border border-amber-200/60">
                    <span className="font-semibold">{warn.productName} ({warn.size})</span>
                    <span>
                      Current: <strong className="text-rose-600">{warn.currentAvailable}</strong> (Threshold: {warn.minThreshold})
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Tomorrow Demand Forecast */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-sm text-slate-900">Tomorrow's Milk Demand</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">Cutoff 8:00 PM Tonight</span>
            </div>

            <div className="space-y-3">
              {stats.tomorrowDemand.map((dem, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs border border-slate-100">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{dem.productName} ({dem.size})</span>
                    <span className="text-brand-800">{dem.unitsNeededTomorrow} units required</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Procurement Scheduled: {dem.expectedProcurement} units</span>
                    {dem.projectedShortage > 0 ? (
                      <span className="text-rose-600 font-bold">
                        ⚠️ Shortage: {dem.projectedShortage} units
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">✓ Surplus +{dem.expectedProcurement - dem.unitsNeededTomorrow}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Link to="/admin/procurement">
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                Issue Purchase Order to Farm Suppliers →
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};
