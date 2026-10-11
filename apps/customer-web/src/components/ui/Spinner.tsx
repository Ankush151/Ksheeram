import React from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className, size = 'md', label }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          'rounded-full border-brand-200 border-t-brand-600 animate-spin',
          sizes[size],
          className
        )}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
};
