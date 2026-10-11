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
    md: 'w-7 h-7 border-3',
    lg: 'w-10 h-10 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      <div
        className={cn(
          'rounded-full border-slate-200 border-t-brand-600 animate-spin',
          sizes[size],
          className
        )}
      />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
};
