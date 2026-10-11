import React from 'react';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  minHeight?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  minHeight = 'min-h-[320px]',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto ${minHeight}`}>
      <div className="w-16 h-16 rounded-3xl bg-cream-100 text-brand-700 flex items-center justify-center mb-4 shadow-sm border border-cream-200">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-500 leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
