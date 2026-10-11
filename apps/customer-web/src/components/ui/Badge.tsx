import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'emerald' | 'amber';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    emerald: 'bg-brand-50 text-brand-800 border-brand-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    amber: 'bg-orange-50 text-orange-800 border-orange-200',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    emerald: 'bg-brand-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    amber: 'bg-orange-500',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full gap-1.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border tracking-tight shrink-0 select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
