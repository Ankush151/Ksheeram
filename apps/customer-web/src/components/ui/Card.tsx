import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = false,
  bordered = true,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl transition-all duration-200',
        bordered ? 'border border-slate-200/80 shadow-soft' : '',
        hoverEffect ? 'hover:shadow-soft-lg hover:-translate-y-0.5' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
