import React from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'danger';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  ...props
}) => {
  const normalizedVariant = variant === 'danger' ? 'error' : variant;

  const styles = {
    info: 'bg-sky-50 text-sky-900 border-sky-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-2.5 p-3.5 rounded-xl border text-xs', styles[normalizedVariant], className)}
      {...props}
    >
      {icons[normalizedVariant]}
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-bold text-xs">{title}</h4>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
