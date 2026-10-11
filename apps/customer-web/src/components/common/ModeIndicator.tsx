import React, { useState } from 'react';
import { env } from '@/config/env';
import { Database, Server, Info, X } from 'lucide-react';

export const ModeIndicator: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-white text-xs py-1.5 px-4 sticky top-0 z-40 border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                env.USE_MOCK_API ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                env.USE_MOCK_API ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>

          <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-300">
            {env.USE_MOCK_API ? 'Mock API Mode' : 'Live Express Backend Mode'}
          </span>

          <span className="text-slate-400 hidden sm:inline">•</span>

          <span className="text-slate-300 hidden md:inline">
            {env.USE_MOCK_API
              ? 'Simulating backend with stateful in-memory latency adapter'
              : `Connected to ${env.API_BASE_URL}`}
          </span>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-amber-300 hover:text-amber-200 underline text-[11px] font-medium ml-1"
          >
            {showDetails ? 'Hide details' : 'How to connect real API?'}
          </button>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          title="Dismiss top banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-slate-800 max-w-7xl mx-auto text-slate-300 space-y-1 pb-1">
          <p className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-brand-400" />
            <span>
              Target API Base URL:{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-brand-300">
                {env.API_BASE_URL}
              </code>
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>
              To connect your real Express + MongoDB backend: Update{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">.env</code> to{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                VITE_USE_MOCK_API=false
              </code>{' '}
              and restart Vite.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
