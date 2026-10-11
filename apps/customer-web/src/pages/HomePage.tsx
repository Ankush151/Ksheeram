import React from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/features/products/useProducts';
import { useCart } from '@/features/cart/CartContext';
import { formatINR } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Truck,
  Heart,
  Droplet,
  ChevronRight,
  Check,
  X as CloseIcon,
  MessageCircle,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { data: products, isLoading } = useProducts();
  const { addToCart } = useCart();

  const milkProducts = products?.filter((p) => p.category.includes('milk')) || [];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 bg-gradient-to-b from-brand-50/70 via-cream-50 to-[#FDFCF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold tracking-tight">
                <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />
                <span>100% Raw Chilled Milk • Zero Preservatives</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-serif leading-[1.15]">
                Pure Farm-Fresh Milk, Delivered Before{' '}
                <span className="text-brand-700 underline decoration-brand-300 decoration-wavy decoration-2">
                  7:00 AM
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Procured directly from verified Indian dairy farmers, tested for 24 purity parameters, and delivered silently to your doorstep in sterilized glass bottles and eco-pouches.
              </p>

              {/* Highlights Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                  <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Before 7 AM Drop</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>24 Lab Purity Tests</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/70 shadow-2xs col-span-2 sm:col-span-1">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Pause Anytime</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <Link to="/products">
                  <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Start Daily Subscription
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    One-Time Order
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200/60 text-xs text-slate-500">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                    alt="User"
                  />
                </div>
                <p>
                  <span className="font-bold text-slate-800">4.9/5 Rating</span> trusted by 12,000+ morning families across Bengaluru &amp; NCR
                </p>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-brand-300 to-amber-200 rounded-3xl blur-xl opacity-40 animate-pulse" />

                <div className="relative bg-white rounded-3xl p-4 shadow-soft-xl border border-slate-100 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80"
                    alt="Pure farm milk in glass bottle"
                    className="w-full h-80 sm:h-96 object-cover rounded-2xl"
                  />

                  {/* Floating Floating Badge 1 */}
                  <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                      <Droplet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">4°C Chilled Drop</p>
                      <p className="text-[10px] text-slate-500">Unbroken Cold Chain</p>
                    </div>
                  </div>

                  {/* Floating Badge 2 */}
                  <div className="absolute bottom-8 right-8 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-3 shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Morning Dispatch</p>
                      <p className="text-[10px] text-slate-300">Quiet Doorstep Service</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="emerald" size="md">
            Direct Farm Sourcing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 font-serif tracking-tight">
            Our Signature Daily Milk Range
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Available in flexible 500 ml pouches and 1 Litre UV-sterilized glass bottles. Choose daily, alternate days, or custom weekly delivery.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner size="lg" label="Loading fresh milk varieties..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {milkProducts.map((product) => {
              const defaultVariant = product.variants[1] || product.variants[0];

              return (
                <Card
                  key={product.id}
                  hoverEffect
                  className="flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    <div className="relative w-full h-52 sm:h-56 aspect-[4/3] overflow-hidden bg-slate-100 flex items-center justify-center">
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.isBestSeller && (
                        <span className="absolute top-3 left-3 z-10 bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                          Best Seller
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs">
                        {product.fatContent} Fat
                      </span>
                    </div>

                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {product.tagline}
                        </p>
                      </div>

                      {/* Package Sizes & Prices */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Available Packages:</span>
                          <span className="font-semibold text-slate-800">500ml &amp; 1 Litre</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Starting from:</span>
                          <span className="text-base font-extrabold text-brand-700">
                            {formatINR(product.variants[0]?.price || 38)}
                            <span className="text-[11px] font-normal text-slate-500"> / {product.variants[0]?.size}</span>
                          </span>
                        </div>
                      </div>

                      {/* Benefits Bullets */}
                      <ul className="space-y-1 pt-1 text-xs text-slate-600">
                        {product.benefits.slice(0, 2).map((b, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span className="truncate">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center gap-2.5">
                    <Link to={`/products/${product.slug}`} className="flex-1">
                      <Button variant="primary" className="w-full text-xs font-semibold">
                        View &amp; Subscribe
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => addToCart(product, defaultVariant, 1, 'one_time')}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-brand-500 text-slate-700 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      title="Add 1-time delivery to cart"
                    >
                      <Truck className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/products">
            <Button variant="outline" size="lg" rightIcon={<ChevronRight className="w-4 h-4" />}>
              Explore Full Dairy Catalog (Ghee, Paneer, Curd)
            </Button>
          </Link>
        </div>
      </section>

      {/* The 4-Step Farm to Cup Journey */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">
              Our 12-Hour Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-serif">
              From Indian Farms to Your Doorstep
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Unlike industrial supermarket milk that sits in plastic pouches for 4–6 days, Ksheeraam delivers within 12 hours of milking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h3 className="font-bold text-white text-base">Ethical Farm Milking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Procured at 5:00 AM from verified indigenous Gir cows and Murrah buffaloes fed green herbal fodder.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h3 className="font-bold text-white text-base">Instant 4°C Chilling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immediately chilled to 4°C within 45 minutes of milking to stop bacterial replication without preservatives.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h3 className="font-bold text-white text-base">24 Parameter Testing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tested for urea, starch, detergents, antibiotics, aflatoxins, and water adulteration in certified labs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-lg">
                4
              </div>
              <h3 className="font-bold text-white text-base">Doorstep Drop by 7 AM</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dispatched in insulated crates and placed at your doorstep before you wake up for morning tea.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison: Ksheeraam vs Market Packet Milk */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="amber" size="md">
            Transparency
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2 font-serif">
            Why Switch from Commercial Packet Milk?
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-4 sm:p-5">Parameter</th>
                  <th className="p-4 sm:p-5 bg-brand-50 text-brand-900 font-extrabold">Ksheeraam Milk</th>
                  <th className="p-4 sm:p-5 text-slate-500">Commercial Packet Milk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">Freshness from Milking</td>
                  <td className="p-4 sm:p-5 bg-brand-50/40 text-brand-900 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600" />
                    <span>Delivered in 12–16 Hours</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">4 to 6 Days Old</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">Processing &amp; Adulteration</td>
                  <td className="p-4 sm:p-5 bg-brand-50/40 text-brand-900 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600" />
                    <span>Raw Whole Milk, Untampered</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Skimmed, Reconstituted Powder</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">Packaging Quality</td>
                  <td className="p-4 sm:p-5 bg-brand-50/40 text-brand-900 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600" />
                    <span>UV Sterilized Glass / Food Pouches</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Low-grade Single-use Plastic</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">Antibiotic &amp; Hormone Guarantee</td>
                  <td className="p-4 sm:p-5 bg-brand-50/40 text-brand-900 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600" />
                    <span>Certified Zero Oxytocin &amp; Chemicals</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Not Tested Daily</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-slate-800">Subscription Flexibility</td>
                  <td className="p-4 sm:p-5 bg-brand-50/40 text-brand-900 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-600" />
                    <span>Pause, resume or change in 1 click</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-500">Manual Daily Grocery Runs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WhatsApp Assisted Order Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-800 via-brand-800 to-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-soft-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4 text-left">
            <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase">
              Assisted Milk Delivery
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif">
              Prefer to order or setup subscription on WhatsApp?
            </h2>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Our dairy concierge can configure your daily drop schedule, save your apartment instructions, and start your morning milk delivery over a simple WhatsApp chat.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/919876543210?text=Hello%20Ksheeraam!%20I%20would%20like%20to%20start%20milk%20delivery%20for%20my%20address."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-sm"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Chat with Dairy Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
