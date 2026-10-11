import React from 'react';
import { SubscriptionFrequency } from '@/types/subscriptions';
import { Calendar, Repeat, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FrequencySelectorProps {
  frequency: SubscriptionFrequency;
  customDays?: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  onChangeFrequency: (freq: SubscriptionFrequency) => void;
  onChangeCustomDays?: (days: number[]) => void;
  className?: string;
}

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon', full: 'Monday' },
  { day: 2, label: 'Tue', full: 'Tuesday' },
  { day: 3, label: 'Wed', full: 'Wednesday' },
  { day: 4, label: 'Thu', full: 'Thursday' },
  { day: 5, label: 'Fri', full: 'Friday' },
  { day: 6, label: 'Sat', full: 'Saturday' },
  { day: 0, label: 'Sun', full: 'Sunday' },
];

export const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  frequency,
  customDays = [1, 2, 3, 4, 5, 6, 0],
  onChangeFrequency,
  onChangeCustomDays,
  className,
}) => {
  const toggleDay = (day: number) => {
    if (!onChangeCustomDays) return;
    const exists = customDays.includes(day);
    if (exists) {
      if (customDays.length <= 1) return; // Must keep at least one day
      onChangeCustomDays(customDays.filter((d) => d !== day));
    } else {
      onChangeCustomDays([...customDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Daily Option */}
        <button
          type="button"
          onClick={() => onChangeFrequency('daily')}
          className={cn(
            'flex flex-col items-start p-4 rounded-2xl border text-left transition-all',
            frequency === 'daily'
              ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          )}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center',
                frequency === 'daily' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              <Repeat className="w-4 h-4" />
            </span>
            {frequency === 'daily' && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-200 text-brand-900">
                Popular
              </span>
            )}
          </div>
          <span className="font-bold text-sm text-slate-900">Daily Drop</span>
          <span className="text-xs text-slate-500 mt-0.5">Every morning by 7 AM</span>
        </button>

        {/* Alternate Day Option */}
        <button
          type="button"
          onClick={() => onChangeFrequency('alternate')}
          className={cn(
            'flex flex-col items-start p-4 rounded-2xl border text-left transition-all',
            frequency === 'alternate'
              ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          )}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center',
                frequency === 'alternate' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <span className="font-bold text-sm text-slate-900">Alternate Days</span>
          <span className="text-xs text-slate-500 mt-0.5">Every 2nd morning</span>
        </button>

        {/* Custom Days Option */}
        <button
          type="button"
          onClick={() => onChangeFrequency('custom')}
          className={cn(
            'flex flex-col items-start p-4 rounded-2xl border text-left transition-all',
            frequency === 'custom'
              ? 'border-brand-600 bg-brand-50/70 shadow-sm ring-2 ring-brand-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          )}
        >
          <div className="flex items-center justify-between w-full mb-1.5">
            <span
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center',
                frequency === 'custom' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <span className="font-bold text-sm text-slate-900">Custom Days</span>
          <span className="text-xs text-slate-500 mt-0.5">Pick specific weekdays</span>
        </button>
      </div>

      {/* Weekday Selector for Custom Schedule */}
      {frequency === 'custom' && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-fadeIn">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            Select Delivery Days
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((item) => {
              const isSelected = customDays.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => toggleDay(item.day)}
                  className={cn(
                    'py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all',
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                  title={item.full}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Delivering on {customDays.length} days every week.
          </p>
        </div>
      )}
    </div>
  );
};
