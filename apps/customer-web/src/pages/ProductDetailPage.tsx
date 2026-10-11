import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useProduct } from '@/features/products/useProducts';
import { useCart } from '@/features/cart/CartContext';
import { useQuoteSubscription } from '@/features/subscriptions/useSubscriptions';
import { PackageSize } from '@/types/products';
import { SubscriptionFrequency } from '@/types/subscriptions';
import { formatINR } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { QuantitySelector } from '@/components/common/QuantitySelector';
import { FrequencySelector } from '@/components/common/FrequencySelector';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Truck,
  MessageCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const { data: product, isLoading, isError, refetch } = useProduct(slug);

  // Intent: default to subscription if query parameter ?intent=subscribe or if product is subscription-only
  const initialMode = searchParams.get('intent') === 'subscribe' ? 'subscription' : 'subscription';
  const [orderMode, setOrderMode] = useState<'subscription' | 'one_time'>(initialMode);

  // Selected Variant (500ml vs 1L)
  const [selectedSize, setSelectedSize] = useState<PackageSize>('1L');

  // Subscription Configuration
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [quantity, setQuantity] = useState<number>(1);

  // Server Quote Mutation
  const quoteMutation = useQuoteSubscription();

  // Set default size once product is loaded
  useEffect(() => {
    if (product && product.variants.length > 0) {
      const preferred = product.variants.find((v) => v.size === '1L') || product.variants[0];
      setSelectedSize(preferred.size);
    }
  }, [product]);

  // Request authoritative quote from backend when config changes
  useEffect(() => {
    if (product && orderMode === 'subscription') {
      const variant = product.variants.find((v) => v.size === selectedSize) || product.variants[0];
      if (variant) {
        quoteMutation.mutate({
          items: [{ productId: product.id, variantId: variant.id, quantity }],
          frequency,
          customDays: frequency === 'custom' ? customDays : undefined,
          addressId: 'addr_001',
        });
      }
    }
  }, [product, selectedSize, quantity, frequency, customDays, orderMode]);

  if (isLoading) {
    return <LoadingState message="Loading milk specifications &amp; testing logs..." />;
  }

  if (isError || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState
          title="Product not found"
          message="We could not find this product or it may be temporarily out of stock."
          onRetry={() => refetch()}
        />
        <div className="text-center mt-4">
          <Link to="/products">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeVariant = product.variants.find((v) => v.size === selectedSize) || product.variants[0];

  const handleProceed = () => {
    addToCart(
      product,
      activeVariant,
      quantity,
      orderMode,
      frequency,
      frequency === 'custom' ? customDays : undefined
    );
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Dairy Products</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Gallery and Purity Testing Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-soft">
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = 'true';
                  target.src = '/images/products/cow-milk.png';
                }
              }}
              className="w-full h-80 sm:h-[450px] object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {product.category.replace('_', ' ').toUpperCase()}
              </span>
              {product.isBestSeller && (
                <span className="bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                  Best Seller
                </span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Packaging Type</p>
                <p className="text-sm font-bold text-slate-900 capitalize">
                  {activeVariant.packagingType === 'glass_bottle'
                    ? 'UV-Sterilized Returnable Glass'
                    : 'Food-Grade Eco Pouch'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Chilling Temp</p>
                <p className="text-sm font-bold text-brand-700">{product.coldChainTemp}</p>
              </div>
            </div>
          </div>

          {/* Laboratory Quality Grid */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-base">24 Parameter Certified Lab Tests</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Milk Fat</span>
                <span className="font-bold text-slate-800 text-sm">{product.fatContent}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">SNF Content</span>
                <span className="font-bold text-slate-800 text-sm">{product.snfContent}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Shelf Life</span>
                <span className="font-bold text-slate-800 text-sm">{product.shelfLife}</span>
              </div>
            </div>

            <ul className="space-y-2 pt-2 border-t border-slate-100">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right Configuration and Subscription Card */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              {product.name}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Mode Selector (Subscription vs One-Time) */}
          <div className="p-1.5 bg-slate-100 rounded-2xl flex gap-1">
            <button
              type="button"
              onClick={() => setOrderMode('subscription')}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                orderMode === 'subscription'
                  ? 'bg-white text-brand-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Recurring Milk Subscription</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('one_time')}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2',
                orderMode === 'one_time'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              <span>One-Time Order</span>
            </button>
          </div>

          {/* Package Size Configuration (500ml vs 1L) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Choose Packaging Size
            </label>
            <div className="grid grid-cols-2 gap-3">
              {product.variants.map((v) => {
                const isSelected = selectedSize === v.size;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedSize(v.size)}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all',
                      isSelected
                        ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-slate-900">{v.size}</span>
                      <span className="text-sm font-extrabold text-brand-700">
                        {formatINR(v.price)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 capitalize">
                      {v.packagingType === 'glass_bottle' ? 'Glass Bottle' : 'Eco Pouch'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Quantity Per Delivery
            </label>
            <div className="flex items-center gap-4">
              <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={10} size="lg" />
              <span className="text-xs text-slate-500 font-medium">
                packets/bottles per morning drop
              </span>
            </div>
          </div>

          {/* Subscription Frequency Selector */}
          {orderMode === 'subscription' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                3. Delivery Frequency
              </label>
              <FrequencySelector
                frequency={frequency}
                customDays={customDays}
                onChangeFrequency={setFrequency}
                onChangeCustomDays={setCustomDays}
              />
            </div>
          )}

          {/* Server-Returned Authoritative Quote Summary */}
          {orderMode === 'subscription' && (
            <div className="p-5 rounded-2xl bg-brand-50/60 border border-brand-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Authoritative Server Quote (30 Days)</span>
                </span>
                {quoteMutation.isPending && (
                  <span className="text-[10px] text-brand-700 animate-pulse font-semibold">
                    Calculating...
                  </span>
                )}
              </div>

              {quoteMutation.data && (
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Estimated Deliveries in Month:</span>
                    <span className="font-bold text-slate-900">
                      {quoteMutation.data.estimatedDeliveriesPerMonth} mornings
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Per Drop Amount:</span>
                    <span className="font-bold text-slate-900">
                      {formatINR(quoteMutation.data.perDeliveryTotal)}
                    </span>
                  </div>
                  {quoteMutation.data.bottleDeposit > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Refundable Glass Bottle Deposit:</span>
                      <span className="font-bold">
                        +{formatINR(quoteMutation.data.bottleDeposit)}
                      </span>
                    </div>
                  )}
                  {quoteMutation.data.discountAmount > 0 && (
                    <div className="flex justify-between text-brand-700 font-bold">
                      <span>Monthly Plan Discount (5%):</span>
                      <span>-{formatINR(quoteMutation.data.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-brand-200 text-sm font-extrabold text-brand-900">
                    <span>Total Monthly Estimate:</span>
                    <span className="text-base">
                      {formatINR(quoteMutation.data.totalPayableNow)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-brand-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Next morning delivery guaranteed before 7:00 AM. Free doorstep drop.</span>
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              className="w-full text-base font-bold"
              onClick={handleProceed}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {orderMode === 'subscription' ? 'Confirm Subscription Schedule' : 'Proceed to Checkout'}
            </Button>

            <a
              href={`https://wa.me/919876543210?text=${encodeURIComponent(
                `Hello Ksheeraam! I would like to order ${quantity}x ${product.name} (${selectedSize}) on ${frequency} schedule.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-900 text-xs font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Order via WhatsApp Concierge</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
