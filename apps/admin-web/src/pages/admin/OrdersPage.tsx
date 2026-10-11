import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/features/orders/ordersApi';
import { AdminOrder } from '@/types/orders';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Truck,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: ordersApi.getOrders,
  });

  const allocateMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.allocateStock(orderId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated);
      }
    },
  });

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const unallocatedCount = orders.filter((o) => !o.stockAllocated).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            Customer Orders & Dispatches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily milk orders, one-time requests, prepaid subscription drops, stock allocations, and delivery fulfillments.
          </p>
        </div>
        {unallocatedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {unallocatedCount} orders awaiting stock allocation
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Search order #, customer, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            {['all', 'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
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

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load customer orders.</Alert>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No orders match criteria</p>
            <p className="text-sm mt-1">Try resetting the filter or search query.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Milk Items</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Allocation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => {
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {ord.orderNumber}
                        <div className="text-[11px] text-slate-400 font-sans font-normal">
                          {formatCurrency(ord.totalAmount || ord.total || 0)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{ord.customerName}</div>
                        <div className="text-xs text-slate-500">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" className="capitalize text-[11px]">
                          {ord.orderType.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-800 font-medium">
                          {ord.items.map((it) => `${it.quantity}x ${it.productName} (${it.size})`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {ord.deliveryDate}
                        <div className="text-[11px] text-slate-400">{ord.deliverySlot}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            ord.paymentStatus === 'paid'
                              ? 'success'
                              : ord.paymentStatus === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                          className="capitalize text-[11px]"
                        >
                          {ord.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.stockAllocated ? (
                          <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Allocated
                          </span>
                        ) : (
                          <span className="text-amber-700 text-xs font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> Awaiting
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            ord.status === 'delivered'
                              ? 'success'
                              : ord.status === 'out_for_delivery'
                              ? 'info'
                              : ord.status === 'packed'
                              ? 'neutral'
                              : ord.status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                          className="capitalize text-[11px]"
                        >
                          {ord.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedOrder(ord)}
                            className="text-xs"
                          >
                            Details
                          </Button>
                          {!ord.stockAllocated && ord.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={allocateMutation.isPending}
                              onClick={() => allocateMutation.mutate(ord.id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              Allocate
                            </Button>
                          )}
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

      {/* ORDER INSPECTION MODAL */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Inspection - ${selectedOrder?.orderNumber}`}
      >
        {selectedOrder && (
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Customer</span>
                <strong className="text-slate-900 text-sm">{selectedOrder.customerName}</strong>
                <div className="text-slate-600">{selectedOrder.customerPhone}</div>
              </div>
              <div>
                <span className="text-slate-500 block">Status & Allocation</span>
                <div className="flex gap-1.5 mt-1">
                  <Badge variant="neutral">{selectedOrder.status.replace('_', ' ')}</Badge>
                  <Badge variant={selectedOrder.stockAllocated ? 'success' : 'warning'}>
                    {selectedOrder.stockAllocated ? 'Stock Allocated' : 'Unallocated'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Order Items & Pricing
              </h4>
              <div className="divide-y divide-slate-100">
                {selectedOrder.items.map((it, i) => (
                  <div key={i} className="py-2 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{it.productName}</span>
                      <span className="text-slate-500 ml-2">({it.size}) &times; {it.quantity}</span>
                    </div>
                    <div className="font-mono font-medium text-slate-900">
                      {formatCurrency(it.totalPrice || it.subtotal || 0)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-xs">
                <span>Total Amount:</span>
                <span>{formatCurrency(selectedOrder.totalAmount || selectedOrder.total || 0)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-1 text-xs">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Delivery Details
              </h4>
              <p className="text-slate-800">{selectedOrder.deliveryAddress}</p>
              <div className="text-slate-500 mt-1">
                Date: {selectedOrder.deliveryDate} ({selectedOrder.deliverySlot})
              </div>
              {selectedOrder.instructions && (
                <p className="text-amber-700 italic mt-1">Note: "{selectedOrder.instructions}"</p>
              )}
            </div>

            {selectedOrder.assignedAgentName && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="text-blue-700 block font-medium">Assigned Delivery Partner:</span>
                  <strong>{selectedOrder.assignedAgentName}</strong>
                </div>
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
              {!selectedOrder.stockAllocated && (
                <Button
                  type="button"
                  variant="primary"
                  disabled={allocateMutation.isPending}
                  onClick={() => allocateMutation.mutate(selectedOrder.id)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Allocate Saleable Stock Now
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default OrdersPage;
