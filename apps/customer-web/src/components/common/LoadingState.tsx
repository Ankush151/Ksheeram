import React from 'react';
import { Spinner } from '@/components/ui/Spinner';

export interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Fetching fresh updates from dairy...',
  minHeight = 'min-h-[300px]',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${minHeight}`}>
      <Spinner size="lg" />
      <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
};
