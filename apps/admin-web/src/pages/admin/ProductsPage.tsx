import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/features/products/productsApi';
import { formatINR } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Package, Plus, CheckCircle, ShieldCheck } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.getProducts(),
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif">
            Products &amp; Packaging Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure 500 ml pouches, 1 Litre UV-sterilized returnable glass bottles, and selling prices.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Spinner label="Loading products..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products?.map((prod) => (
            <Card key={prod.id} className="p-5 space-y-4 border border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{prod.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">
                      Category: {prod.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <Badge variant="emerald" dot>
                  Active
                </Badge>
              </div>

              {/* Quality Standards */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Fat Content</span>
                  <span className="font-bold text-slate-800">{prod.fatContent}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SNF Content</span>
                  <span className="font-bold text-slate-800">{prod.snfContent}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cold Chain</span>
                  <span className="font-bold text-slate-800">{prod.coldChainTemp}</span>
                </div>
              </div>

              {/* Packaged Variants Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Configured Packaged Units &amp; Prices
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {prod.variants.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-900">{v.size}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {v.packagingType === 'glass_bottle' ? 'Glass Bottle' : 'Eco Pouch'}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline pt-1">
                        <span className="font-bold text-brand-700 text-sm">
                          {formatINR(v.price)}
                        </span>
                        <span className="text-[11px] text-slate-400 line-through">
                          MRP {formatINR(v.mrp)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Available in hub: <strong>{v.saleableUnits} units</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
