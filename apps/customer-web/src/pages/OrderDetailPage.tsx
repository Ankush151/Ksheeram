import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/features/orders/useOrders';
import { formatINR, formatDate, formatDateTime } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OrderTimeline } from '@/components/common/OrderTimeline';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  ArrowLeft,
  Truck,
  Phone,
  MapPin,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrder(id);

  if (isLoading) {
    return <LoadingState message="Fetching live order tracking and dispatch logs..." />;
  }

  if (isError || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          title="Order not found"
          message="We could not locate this order tracking ID."
          onRetry={() => refetch()}
        />
        <div className="text-center mt-4">
          <Link to="/orders">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="emerald" dot>Delivered</Badge>;
      case 'out_for_delivery':
        return <Badge variant="info" dot>Out for Morning Drop</Badge>;
      case 'confirmed':
      case 'packed':
        return <Badge variant="warning" dot>Processing &amp; Chilled</Badge>;
      case 'cancelled':
        return <Badge variant="danger" dot>Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Order History</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              Order {order.orderNumber}
            </h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {formatDateTime(order.createdAt)} •{' '}
            {order.orderType === 'subscription_delivery'
              ? 'Daily Subscription Drop'
              : 'One-Time Delivery'}
          </p>
        </div>

        <Link to="/payments">
          <Button variant="outline" size="sm" leftIcon={<Receipt className="w-4 h-4" />}>
            View Invoices
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Tracking Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Live Delivery Timeline</h3>
              <span className="text-xs text-brand-700 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{order.deliverySlot}</span>
              </span>
            </div>

            <OrderTimeline timeline={order.timeline} currentStatus={order.status} />

            {/* Delivery Partner Card */}
            {order.driverName && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{order.driverName}</h4>
                    <p className="text-[11px] text-slate-500">Ksheeraam Delivery Partner</p>
                  </div>
                </div>

                {order.driverPhone && (
                  <a
                    href={`tel:${order.driverPhone}`}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-brand-700 hover:bg-brand-50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Partner</span>
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* Delivery Address */}
          <Card className="p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-base">Drop Location</h3>
            <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{order.address?.label} Address</span>
              </div>
              <p>
                {order.address?.flatNumber}, {order.address?.buildingName}
                <br />
                {order.address?.streetArea}
                <br />
                {order.address?.city} — {order.address?.pincode}
              </p>
            </div>
          </Card>
        </div>

        {/* Right: Items Breakdown and Bill */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Order Items</h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{it.productName}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {it.size} • Qty: {it.quantity}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-800">
                    {formatINR(it.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Calculation */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Morning Delivery:</span>
                <span className="font-semibold text-slate-800">
                  {order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}
                </span>
              </div>
              {order.packagingFee > 0 && (
                <div className="flex justify-between">
                  <span>Sterilized Packaging:</span>
                  <span className="font-semibold text-slate-800">{formatINR(order.packagingFee)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-brand-700 font-bold">
                  <span>Discount:</span>
                  <span>-{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                <span>Total Paid:</span>
                <span className="text-brand-700 text-base">{formatINR(order.total)}</span>
              </div>
            </div>

            {/* Payment Status Info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Status:</span>
              <Badge
                variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                size="sm"
              >
                {order.paymentStatus.toUpperCase()} ({order.paymentMethod.toUpperCase()})
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
