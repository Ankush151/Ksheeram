import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { UserRole } from '@/types/auth';
import { Lock, Phone, ShieldCheck, Truck, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('admin@ksheeraam.com');
  const [password, setPassword] = useState('Ksheeraam@123');
  const [role, setRole] = useState<UserRole>('admin');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ phoneOrEmail, password, role });
      if (role === 'delivery_agent') {
        navigate('/delivery/manifest', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAs = async (selectedRole: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      const email = selectedRole === 'delivery_agent' ? 'agent@ksheeraam.com' : 'admin@ksheeraam.com';
      await login({ phoneOrEmail: email, password: 'Ksheeraam@123', role: selectedRole });
      if (selectedRole === 'delivery_agent') {
        navigate('/delivery/manifest', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-white">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg mb-3">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight">Ksheeraam Operations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Administrative &amp; Morning Delivery Agent Portal
          </p>
        </div>

        <Card className="p-6 space-y-5 bg-white border-0 shadow-2xl">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Quick 1-Click Role Switcher for Testing */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
              Quick Role Launchers
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => quickLoginAs('admin')}
                leftIcon={<ShieldCheck className="w-4 h-4 text-brand-600" />}
              >
                Admin Console
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold"
                onClick={() => quickLoginAs('delivery_agent')}
                leftIcon={<Truck className="w-4 h-4 text-emerald-600" />}
              >
                Delivery Partner
              </Button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Radio Pills */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setPhoneOrEmail('operations@ksheeraam.com');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    role === 'admin'
                      ? 'border-brand-600 bg-brand-50 text-brand-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Operations Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('delivery_agent');
                    setPhoneOrEmail('9845012345');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                    role === 'delivery_agent'
                      ? 'border-brand-600 bg-brand-50 text-brand-900'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Delivery Agent
                </button>
              </div>
            </div>

            <Input
              label="Staff Phone or Email"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />

            <Input
              label="PIN or Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full text-sm font-bold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
