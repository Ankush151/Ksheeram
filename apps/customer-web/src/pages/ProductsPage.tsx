import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/features/products/useProducts';
import { useCart } from '@/features/cart/CartContext';
import { Product, PackageSize } from '@/types/products';
import { formatINR } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Search,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  SlidersHorizontal,
  Droplet,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const ProductsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSizes, setSelectedSizes] = useState<Record<string, PackageSize>>({});
  const { addToCart } = useCart();

  const { data: products, isLoading, isError, refetch } = useProducts(
    selectedCategory === 'all' ? undefined : selectedCategory,
    searchQuery
  );

  // Instant client-side filtering for immediate zero-latency feedback while typing
  const filteredProducts = (products || []).filter((product) => {
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      const matchCat = product.category.toLowerCase().includes(q);
      const matchTag = product.tagline?.toLowerCase().includes(q);
      return matchName || matchDesc || matchCat || matchTag;
    }
    return true;
  });

  const categories = [
    { id: 'all', label: 'All Dairy Products' },
    { id: 'cow_milk', label: 'Cow Milk' },
    { id: 'a2_milk', label: 'Gir Cow A2 Milk' },
    { id: 'buffalo_milk', label: 'Buffalo Milk' },
    { id: 'ghee', label: 'Bilona Ghee' },
    { id: 'paneer', label: 'Fresh Paneer' },
  ];

  const handleSizeChange = (productId: string, size: PackageSize) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const getActiveVariant = (product: Product) => {
    const chosenSize = selectedSizes[product.id] || (product.variants[1]?.size || product.variants[0]?.size);
    return product.variants.find((v) => v.size === chosenSize) || product.variants[0];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Page Header */}
      <div className="max-w-2xl">
        <Badge variant="emerald" size="md">
          100% Farm Pure Dairy
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 font-serif tracking-tight">
          Fresh Milk &amp; Traditional Dairy
        </h1>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Configurable in 500 ml eco-pouches and 1 Litre UV-sterilized glass bottles. Subscribe for daily hassle-free morning drops before 7 AM or place one-time orders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                selectedCategory === cat.id
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Search milk, ghee, paneer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Product Content States */}
      {isLoading ? (
        <LoadingState message="Fetching fresh batch availability..." />
      ) : isError ? (
        <ErrorState
          title="Could not load dairy catalog"
          message="Please ensure backend API or mock server is accessible."
          onRetry={() => refetch()}
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Droplet className="w-8 h-8" />}
          title="No products found"
          description="We couldn't find any milk or dairy items matching your filters. Try clearing the search."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedCategory('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const activeVariant = getActiveVariant(product);

            return (
              <Card
                key={product.id}
                hoverEffect
                className="flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Product Image */}
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

                  <div className="p-6 space-y-4">
                    <div>
                      <Link to={`/products/${product.slug}`}>
                        <h3 className="text-lg font-bold text-slate-900 hover:text-brand-700 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {product.tagline}
                      </p>
                    </div>

                    {/* Package Size Switcher (500ml vs 1L) */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Select Packaging Size
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {product.variants.map((v) => {
                          const isSelected = activeVariant.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSizeChange(product.id, v.size)}
                              className={cn(
                                'flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all text-left',
                                isSelected
                                  ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold ring-2 ring-brand-500/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                              )}
                            >
                              <span>{v.size}</span>
                              <span className="text-brand-700 font-bold">{formatINR(v.price)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quality & Cold-Chain Specs */}
                    <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Temperature</span>
                        <span className="font-semibold text-slate-800">{product.coldChainTemp}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">SNF Content</span>
                        <span className="font-semibold text-slate-800">{product.snfContent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action CTAs */}
                <div className="p-6 pt-0 space-y-2">
                  <div className="flex items-center gap-2">
                    {product.isAvailableForSubscription && (
                      <Link to={`/products/${product.slug}?intent=subscribe`} className="flex-1">
                        <Button
                          variant="primary"
                          className="w-full text-xs"
                          leftIcon={<Calendar className="w-3.5 h-3.5" />}
                        >
                          Subscribe Daily
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant={product.isAvailableForSubscription ? 'outline' : 'primary'}
                      className={product.isAvailableForSubscription ? 'flex-1 text-xs' : 'w-full text-xs'}
                      onClick={() => addToCart(product, activeVariant, 1, 'one_time')}
                      leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                    >
                      Order Once
                    </Button>
                  </div>

                  <Link
                    to={`/products/${product.slug}`}
                    className="block text-center text-[11px] text-brand-700 font-semibold hover:underline pt-1"
                  >
                    View detailed nutritional &amp; purity report →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
