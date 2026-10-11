import React from 'react';
import { Address } from '@/types/addresses';
import { MapPin, Plus, CheckCircle, Home, Briefcase, Building } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export interface AddressSelectorProps {
  addresses: Address[];
  selectedId?: string;
  onSelect: (addressId: string) => void;
  onAddNew: () => void;
  className?: string;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  className,
}) => {
  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-4 h-4 text-brand-600" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      default:
        return <Building className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {addresses.map((addr) => {
          const isSelected = addr.id === selectedId;

          return (
            <div
              key={addr.id}
              onClick={() => onSelect(addr.id)}
              className={cn(
                'relative p-4 rounded-2xl border text-left cursor-pointer transition-all',
                isSelected
                  ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-slate-100">
                    {getAddressIcon(addr.addressType)}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{addr.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {addr.isDefault && (
                    <Badge variant="emerald" size="sm">
                      Default
                    </Badge>
                  )}
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-brand-600 fill-brand-100" />
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {addr.flatNumber}, {addr.buildingName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {addr.streetArea}
                {addr.landmark ? `, Near ${addr.landmark}` : ''}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {addr.city}, {addr.state} — {addr.pincode}
              </p>

              {addr.deliveryInstructions && (
                <p className="text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-xl mt-2 border border-amber-200/50">
                  <span className="font-semibold">Note:</span> {addr.deliveryInstructions}
                </p>
              )}
            </div>
          );
        })}

        {/* Add New Address Card */}
        <button
          type="button"
          onClick={onAddNew}
          className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-400 bg-white hover:bg-brand-50/20 text-slate-600 hover:text-brand-700 transition-colors group min-h-[140px]"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors mb-2">
            <Plus className="w-5 h-5 text-slate-500 group-hover:text-brand-600" />
          </div>
          <span className="text-sm font-semibold">Add Delivery Address</span>
          <span className="text-xs text-slate-400 mt-0.5">Home, apartment, or parents</span>
        </button>
      </div>
    </div>
  );
};
