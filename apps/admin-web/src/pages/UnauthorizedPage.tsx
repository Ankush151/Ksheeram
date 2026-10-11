import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-slate-200 shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">403 — Unauthorized Access</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your current account role (<strong>{user?.role}</strong>) does not have permission to view this operational section.
        </p>

        <div className="pt-2">
          {user?.role === 'delivery_agent' ? (
            <Link to="/delivery/manifest">
              <Button variant="primary" size="md">
                Return to My Delivery Manifest
              </Button>
            </Link>
          ) : (
            <Link to="/admin/dashboard">
              <Button variant="primary" size="md">
                Return to Admin Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
