import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 20,
  size = 'md',
  className,
  disabled = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value < max) onChange(value + 1);
  };

  const sizes = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const btnSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden select-none p-1',
        sizes[size],
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min || disabled}
        aria-label="Decrease quantity"
        className={cn(
          'flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors',
          btnSizes[size]
        )}
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <span className="font-bold text-slate-800 px-3 min-w-[28px] text-center">
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max || disabled}
        aria-label="Increase quantity"
        className={cn(
          'flex items-center justify-center rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 active:bg-brand-200 disabled:opacity-30 disabled:hover:bg-brand-50 transition-colors',
          btnSizes[size]
        )}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
};
