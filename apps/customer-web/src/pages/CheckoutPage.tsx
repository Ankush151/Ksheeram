import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { useAddresses, useCreateAddress } from '@/features/addresses/useAddresses';
import { useQuoteOrder, useCreateOrder } from '@/features/orders/useOrders';
import { useQuoteSubscription, useCreateSubscription } from '@/features/subscriptions/useSubscriptions';
import { formatINR } from '@/utils/formatters';
import { Address, CreateAddressPayload } from '@/types/addresses';
import { PaymentMethod } from '@/types/orders';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { AddressSelector } from '@/components/common/AddressSelector';
import { QuantitySelector } from '@/components/common/QuantitySelector';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Wallet,
  ArrowRight,
  Trash2,
  Plus,
  Tag,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const CheckoutPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const createAddressMutation = useCreateAddress();

  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Address creation modal
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState<CreateAddressPayload>({
    label: 'Home',
    addressType: 'home',
    flatNumber: '',
    buildingName: '',
    streetArea: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    deliveryInstructions: '',
    isDefault: true,
  });

  // Check if cart contains recurring subscription or one-time orders
  const hasSubscription = items.some((i) => i.orderMode === 'subscription');

  // Backend Quote Mutations
  const quoteOrderMutation = useQuoteOrder();
  const quoteSubMutation = useQuoteSubscription();
  const createOrderMutation = useCreateOrder();
  const createSubMutation = useCreateSubscription();

  // Set default address when loaded
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // Request authoritative quote from backend whenever items, address or coupon changes
  useEffect(() => {
    if (items.length === 0 || !selectedAddressId) return;

    if (hasSubscription) {
      const subItem = items.find((i) => i.orderMode === 'subscription') || items[0];
      quoteSubMutation.mutate({
        items: items.map((it) => ({
          productId: it.product.id,
          variantId: it.variant.id,
          quantity: it.quantity,
        })),
        frequency: subItem.frequency || 'daily',
        customDays: subItem.customDays,
        addressId: selectedAddressId,
      });
    } else {
      quoteOrderMutation.mutate({
        items: items.map((it) => ({
          productId: it.product.id,
          variantId: it.variant.id,
          quantity: it.quantity,
        })),
        addressId: selectedAddressId,
        couponCode: appliedCoupon || undefined,
      });
    }
  }, [items, selectedAddressId, appliedCoupon, hasSubscription]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createAddressMutation.mutateAsync(newAddressForm);
      setSelectedAddressId(created.id);
      setIsAddAddressOpen(false);
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    setErrorBanner(null);

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    if (!selectedAddressId) {
      setErrorBanner('Please select or add a delivery address.');
      return;
    }

    try {
      if (hasSubscription) {
        // Create Recurring Subscription
        const subItem = items.find((i) => i.orderMode === 'subscription') || items[0];
        const res = await createSubMutation.mutateAsync({
          items: items.map((it) => ({
            productId: it.product.id,
            variantId: it.variant.id,
            quantity: it.quantity,
          })),
          frequency: subItem.frequency || 'daily',
          customDays: subItem.customDays,
          deliveryAddressId: selectedAddressId,
          startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          paymentMethod: paymentMethod === 'wallet' ? 'prepaid_wallet' : 'upi_autopay',
        });
        clearCart();
        navigate(`/subscriptions/${res.id}`);
      } else {
        // Create One-time Order
        const res = await createOrderMutation.mutateAsync({
          items: items.map((it) => ({
            productId: it.product.id,
            variantId: it.variant.id,
            quantity: it.quantity,
          })),
          deliveryAddressId: selectedAddressId,
          paymentMethod,
          deliveryInstructions,
        });
        clearCart();
        navigate(`/orders/${res.id}`);
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to confirm order. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Your milk basket is empty"
          description="Browse our farm fresh cow, A2, and buffalo milk to schedule morning doorstep delivery."
          actionText="Browse Fresh Products"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  // Quote totals returned by backend
  const orderQuote = quoteOrderMutation.data;
  const subQuote = quoteSubMutation.data;
  const isQuoting = quoteOrderMutation.isPending || quoteSubMutation.isPending;
  const isSubmitting = createOrderMutation.isPending || createSubMutation.isPending;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div>
        <Badge variant="emerald" size="md">
          {hasSubscription ? 'Subscription Checkout' : 'One-Time Delivery'}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
          Review &amp; Confirm Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Delivery slot: 5:30 AM – 7:00 AM Morning Drop. Unbroken 4°C cold chain.
        </p>
      </div>

      {errorBanner && (
        <Alert variant="error" title="Checkout Notice">
          {errorBanner}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Basket Items and Address */}
        <div className="lg:col-span-7 space-y-6">
          {/* Basket Items Card */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Selected Dairy Items ({items.length})
            </h3>

            <div className="divide-y divide-slate-100">
              {items.map((it) => (
                <div key={it.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.product.imageUrl}
                      alt={it.product.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{it.product.name}</h4>
                      <p className="text-xs text-slate-500">
                        {it.variant.size} • {it.variant.packagingType.replace('_', ' ')}
                      </p>
                      <span className="text-xs font-extrabold text-brand-700 mt-0.5 inline-block">
                        {formatINR(it.variant.price)} each
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <QuantitySelector
                      value={it.quantity}
                      onChange={(q) => updateQuantity(it.id, q)}
                      min={1}
                      max={15}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(it.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Delivery Address Selector */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Delivery Address</h3>
              <span className="text-xs text-slate-500 font-medium">Silent drop before 7 AM</span>
            </div>

            {loadingAddresses ? (
              <LoadingState message="Fetching your saved addresses..." minHeight="min-h-[120px]" />
            ) : addresses && addresses.length > 0 ? (
              <AddressSelector
                addresses={addresses}
                selectedId={selectedAddressId}
                onSelect={setSelectedAddressId}
                onAddNew={() => setIsAddAddressOpen(true)}
              />
            ) : (
              <div className="text-center py-6 border border-dashed rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-3">No delivery address saved yet.</p>
                <Button variant="primary" size="sm" onClick={() => setIsAddAddressOpen(true)}>
                  Add Delivery Address
                </Button>
              </div>
            )}
          </Card>

          {/* Payment Method Selector */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Select Payment Method</h3>
            <div className="space-y-2.5">
              {/* UPI */}
              <label
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all',
                  paymentMethod === 'upi'
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900">Instant UPI</span>
                    <p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">
                  Instant
                </Badge>
              </label>

              {/* Wallet Balance */}
              <label
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all',
                  paymentMethod === 'wallet'
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900">
                      Ksheeraam Milk Wallet
                    </span>
                    <p className="text-xs text-slate-500">
                      Current balance: {formatINR(user?.walletBalance || 0)}
                    </p>
                  </div>
                </div>
                <Wallet className="w-4 h-4 text-brand-600" />
              </label>

              {/* Card / Netbanking */}
              <label
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all',
                  paymentMethod === 'card'
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="font-bold text-sm text-slate-900">Credit / Debit Card</span>
                    <p className="text-xs text-slate-500">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-slate-500" />
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Server Quote Bill Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Payment Summary</h3>
              {isQuoting && (
                <span className="text-[10px] font-semibold text-brand-700 animate-pulse">
                  Updating server quote...
                </span>
              )}
            </div>

            {/* Coupon Code Input (One-time orders) */}
            {!hasSubscription && (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input
                  placeholder="Coupon code (e.g. PUREMILK)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  leftIcon={<Tag className="w-3.5 h-3.5" />}
                  className="text-xs"
                />
                <Button type="submit" variant="secondary" size="sm" className="whitespace-nowrap">
                  Apply
                </Button>
              </form>
            )}

            {appliedCoupon && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span>Coupon <strong>{appliedCoupon}</strong> applied!</span>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon('')}
                  className="text-emerald-700 underline text-[11px]"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Authoritative Server Quote Details */}
            <div className="divide-y divide-slate-100 text-xs text-slate-600 space-y-2 pt-2">
              {hasSubscription ? (
                <>
                  <div className="flex justify-between pt-2">
                    <span>Deliveries in 30 Days:</span>
                    <span className="font-semibold text-slate-800">
                      {subQuote?.estimatedDeliveriesPerMonth || 30} mornings
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Per Morning Drop Amount:</span>
                    <span className="font-semibold text-slate-800">
                      {formatINR(subQuote?.perDeliveryTotal || 0)}
                    </span>
                  </div>
                  {(subQuote?.bottleDeposit || 0) > 0 && (
                    <div className="flex justify-between pt-2 text-amber-800">
                      <span>Refundable Glass Bottle Deposit:</span>
                      <span className="font-bold">+{formatINR(subQuote?.bottleDeposit || 0)}</span>
                    </div>
                  )}
                  {(subQuote?.discountAmount || 0) > 0 && (
                    <div className="flex justify-between pt-2 text-brand-700 font-bold">
                      <span>Monthly Subscription Discount:</span>
                      <span>-{formatINR(subQuote?.discountAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 text-base font-extrabold text-slate-900 border-t border-slate-200">
                    <span>Total Payable Now:</span>
                    <span className="text-brand-700">
                      {formatINR(subQuote?.totalPayableNow || 0)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between pt-2">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-slate-800">
                      {formatINR(orderQuote?.subtotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Early Morning Delivery Fee:</span>
                    <span className="font-semibold text-slate-800">
                      {orderQuote?.deliveryFee === 0 ? (
                        <span className="text-brand-700 font-bold">FREE</span>
                      ) : (
                        formatINR(orderQuote?.deliveryFee || 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Packaging &amp; Cold-Chain:</span>
                    <span className="font-semibold text-slate-800">
                      {formatINR(orderQuote?.packagingFee || 15)}
                    </span>
                  </div>
                  {(orderQuote?.discountAmount || 0) > 0 && (
                    <div className="flex justify-between pt-2 text-brand-700 font-bold">
                      <span>Coupon Discount:</span>
                      <span>-{formatINR(orderQuote?.discountAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 text-base font-extrabold text-slate-900 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-brand-700">
                      {formatINR(orderQuote?.total || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Delivery Guarantee Notice */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Truck className="w-4 h-4 text-brand-600" />
                <span>Next Delivery: Tomorrow Before 7:00 AM</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Our delivery partner will place the insulated milk crate outside your apartment door without ringing loudly unless requested.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full text-base font-bold shadow-md"
              onClick={handlePlaceOrder}
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {hasSubscription ? 'Pay & Activate Subscription' : 'Place Morning Milk Order'}
            </Button>

            <p className="text-[11px] text-center text-slate-400">
              * Payment status is verified directly by bank gateway before fulfillment.
            </p>
          </Card>
        </div>
      </div>

      {/* Add Address Modal Dialog */}
      <Modal
        isOpen={isAddAddressOpen}
        onClose={() => setIsAddAddressOpen(false)}
        title="Add Delivery Address"
        description="Enter your apartment details for daily morning delivery drops."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAddress} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Flat / House / Villa #"
              placeholder="e.g. Flat 402, Block B"
              value={newAddressForm.flatNumber}
              onChange={(e) =>
                setNewAddressForm((p) => ({ ...p, flatNumber: e.target.value }))
              }
              required
            />
            <Input
              label="Building / Apartment Name"
              placeholder="e.g. Sobha Lavender"
              value={newAddressForm.buildingName}
              onChange={(e) =>
                setNewAddressForm((p) => ({ ...p, buildingName: e.target.value }))
              }
              required
            />
          </div>

          <Input
            label="Street Area / Layout"
            placeholder="e.g. Sarjapur Main Road, Bellandur"
            value={newAddressForm.streetArea}
            onChange={(e) =>
              setNewAddressForm((p) => ({ ...p, streetArea: e.target.value }))
            }
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Landmark (Optional)"
              placeholder="e.g. Opp. Mother Sanctuary"
              value={newAddressForm.landmark}
              onChange={(e) =>
                setNewAddressForm((p) => ({ ...p, landmark: e.target.value }))
              }
            />
            <Input
              label="Pincode"
              placeholder="e.g. 560103"
              value={newAddressForm.pincode}
              onChange={(e) =>
                setNewAddressForm((p) => ({ ...p, pincode: e.target.value }))
              }
              required
            />
          </div>

          <Input
            label="Delivery Instructions for Rider"
            placeholder="e.g. Leave in milk basket near front door. Don't ring doorbell before 6 AM."
            value={newAddressForm.deliveryInstructions}
            onChange={(e) =>
              setNewAddressForm((p) => ({ ...p, deliveryInstructions: e.target.value }))
            }
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAddressOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createAddressMutation.isPending}
            >
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
