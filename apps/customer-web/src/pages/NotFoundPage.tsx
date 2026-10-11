import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 rounded-3xl bg-cream-100 text-brand-700 flex items-center justify-center mb-6 shadow-sm border border-cream-200">
        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-80">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 font-serif">404 — Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
        The milk delivery route or page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link to="/products">
          <Button variant="outline">Browse Dairy Catalog</Button>
        </Link>
      </div>
    </div>
  );
};
