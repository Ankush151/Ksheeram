import React from 'react';
import { TimelineStep } from '@/types/orders';
import { formatDateTime } from '@/utils/formatters';
import { CheckCircle2, Clock, Truck, Package, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface OrderTimelineProps {
  timeline: TimelineStep[];
  currentStatus: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline, currentStatus }) => {
  const getStepIcon = (status: string, isCompleted: boolean, isCurrent: boolean) => {
    if (currentStatus === 'cancelled') {
      return <AlertCircle className="w-4 h-4 text-rose-600" />;
    }
    if (isCompleted) {
      return <Check className="w-4 h-4 text-white stroke-[3]" />;
    }
    if (isCurrent) {
      if (status === 'out_for_delivery') return <Truck className="w-4 h-4 text-brand-600 animate-bounce" />;
      if (status === 'packed') return <Package className="w-4 h-4 text-brand-600" />;
      return <Clock className="w-4 h-4 text-brand-600 animate-spin" />;
    }
    return <div className="w-2 h-2 rounded-full bg-slate-300" />;
  };

  return (
    <div className="relative pl-6 sm:pl-8 py-2 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {timeline.map((step, idx) => {
        return (
          <div key={idx} className="relative flex items-start group">
            {/* Step Marker */}
            <div
              className={cn(
                'absolute -left-6 sm:-left-8 top-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all',
                step.isCompleted
                  ? 'bg-brand-600 border-brand-600 shadow-sm'
                  : step.isCurrent
                  ? 'bg-white border-brand-600 ring-4 ring-brand-100 shadow-sm'
                  : 'bg-white border-slate-300'
              )}
            >
              {getStepIcon(step.status, step.isCompleted, step.isCurrent)}
            </div>

            {/* Step Details */}
            <div className="ml-2 sm:ml-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className={cn(
                    'text-sm font-bold',
                    step.isCurrent
                      ? 'text-brand-700'
                      : step.isCompleted
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  )}
                >
                  {step.title}
                </h4>
                {step.timestamp && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {formatDateTime(step.timestamp)}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-xs mt-1 leading-relaxed',
                  step.isCurrent || step.isCompleted ? 'text-slate-600' : 'text-slate-400'
                )}
              >
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
