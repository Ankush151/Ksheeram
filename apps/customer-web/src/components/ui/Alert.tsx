import React from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  icon = true,
  children,
  ...props
}) => {
  const styles = {
    info: 'bg-sky-50 text-sky-900 border-sky-200/80',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80',
    error: 'bg-rose-50 text-rose-900 border-rose-200/80',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
  };

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 p-4 rounded-2xl border text-sm', styles[variant], className)}
      {...props}
    >
      {icon && icons[variant]}
      <div className="flex-1 space-y-1">
        {title && <h4 className="font-semibold text-sm leading-tight">{title}</h4>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};
