import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrders } from '@/features/orders/useOrders';
import { formatINR, formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const OrdersPage: React.FC = () => {
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge variant="emerald" dot>
            Delivered
          </Badge>
        );
      case 'out_for_delivery':
        return (
          <Badge variant="info" dot>
            Out for Delivery
          </Badge>
        );
      case 'confirmed':
      case 'packed':
        return (
          <Badge variant="warning" dot>
            Packed &amp; Chilled
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

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Payment Pending</Badge>;
      case 'failed':
        return <Badge variant="danger" size="sm">Failed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald" size="md">
            Order Tracking
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
            Order &amp; Delivery History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily morning subscription drops, view one-time deliveries, and download invoices.
          </p>
        </div>

        <Link to="/products">
          <Button variant="primary" size="md">
            Place New Order
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching your orders and tracking records..." />
      ) : isError ? (
        <ErrorState
          title="Could not load orders"
          message="Unable to fetch order history from the server."
          onRetry={() => refetch()}
        />
      ) : orders && orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No orders placed yet"
          description="Explore our farm-fresh dairy collection to schedule morning doorstep delivery."
          actionText="Browse Fresh Products"
          onAction={() => navigate('/products')}
        />
      ) : (
        <div className="space-y-4">
          {orders?.map((ord) => (
            <Card
              key={ord.id}
              hoverEffect
              className="p-6 border border-slate-200/80 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-base text-slate-900 font-mono">
                      {ord.orderNumber}
                    </span>
                    {getStatusBadge(ord.status)}
                    {getPaymentBadge(ord.paymentStatus)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Placed on {formatDate(ord.createdAt)} •{' '}
                    {ord.orderType === 'subscription_delivery'
                      ? 'Daily Subscription Drop'
                      : 'One-Time Delivery'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Amount</span>
                    <span className="text-lg font-extrabold text-brand-700">
                      {formatINR(ord.total)}
                    </span>
                  </div>

                  <Link to={`/orders/${ord.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      Track Order
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Items Summary Row */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  {ord.items.map((it, idx) => (
                    <p key={idx} className="text-slate-700 font-medium">
                      • {it.quantity}x {it.productName} ({it.size}) — {formatINR(it.subtotal)}
                    </p>
                  ))}
                </div>

                <div className="text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-brand-600" />
                  <span>
                    Delivery: <strong>{formatDate(ord.deliveryDate)}</strong> ({ord.deliverySlot})
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
