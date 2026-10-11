import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Phone, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneOrEmail.trim()) {
      setError('Please enter your mobile number or email.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ phoneOrEmail, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setPhoneOrEmail('customer@ksheeraam.com');
    setPassword('Ksheeraam@123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 mb-4">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
            Welcome to Ksheeraam
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Sign in to manage your morning milk drops, pause deliveries, and track orders.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Demo account quick fill button */}
          <div className="bg-brand-50/80 border border-brand-200/60 p-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-brand-900 font-medium">
              <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Testing demo account available</span>
            </div>
            <button
              type="button"
              onClick={fillDemoAccount}
              className="text-xs font-bold text-brand-700 hover:text-brand-800 underline"
            >
              Autofill Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Mobile Number or Email"
              placeholder="e.g. 9876543210 or name@example.com"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              autoComplete="username"
              required
            />

            <Input
              label="Password or PIN"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full text-sm font-bold mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Ksheeraam
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-brand-700 hover:underline">
              Create an Account
            </Link>
          </div>
        </Card>

        <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>Encrypted authentication • FSSAI Certified Dairy Service</span>
        </p>
      </div>
    </div>
  );
};
