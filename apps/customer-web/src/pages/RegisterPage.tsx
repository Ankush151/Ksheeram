import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { User as UserIcon, Phone, Mail, Lock, ArrowRight, Gift } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      await register({ name, phone: cleanPhone, email, password });
      navigate('/addresses');
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
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
            Join Ksheeraam
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Enjoy pure farm milk delivered quietly to your doorstep before 7:00 AM every morning.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl flex items-center gap-3 text-xs text-amber-900 font-medium">
            <Gift className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Welcome offer: Receive ₹100 instant milk wallet bonus upon registration!</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Aditi Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />

            <Input
              label="Mobile Number (for delivery SMS)"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              prefixText="+91"
              required
            />

            <Input
              label="Email Address (for invoices)"
              type="email"
              placeholder="e.g. aditi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              hint="Minimum 6 characters"
            />

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full text-sm font-bold mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account &amp; Setup Delivery
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-700 hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
