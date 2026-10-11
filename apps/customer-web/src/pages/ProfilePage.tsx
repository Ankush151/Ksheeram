import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useSubscriptions } from '@/features/subscriptions/useSubscriptions';
import { formatINR, formatDate } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  User as UserIcon,
  Phone,
  Mail,
  Wallet,
  Calendar,
  Package,
  MapPin,
  Receipt,
  LogOut,
  ShieldCheck,
  Bell,
  MessageCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: subscriptions } = useSubscriptions();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const activeSubCount = subscriptions?.filter((s) => s.status === 'active').length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div>
        <Badge variant="emerald" size="md">
          Customer Account
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
          My Profile &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal details, milk wallet balance, and delivery notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Account Details & Wallet */}
        <div className="lg:col-span-7 space-y-6">
          {/* User Profile Card */}
          <Card className="p-6 space-y-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-800 font-extrabold flex items-center justify-center text-2xl border border-brand-200 shadow-sm">
                {user?.name?.charAt(0) || 'K'}
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-slate-900 leading-tight">
                  {user?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Member since {formatDate(user?.createdAt)}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={activeSubCount > 0 ? 'emerald' : 'neutral'} size="sm">
                    {activeSubCount > 0 ? `${activeSubCount} Active Plan(s)` : 'No Active Subscription'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs text-slate-700">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span>Mobile (Delivery Contact):</span>
                </span>
                <span className="font-bold text-slate-900">+91 {user?.phone}</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-600" />
                  <span>Email (Invoices &amp; Receipts):</span>
                </span>
                <span className="font-bold text-slate-900">{user?.email || 'Not configured'}</span>
              </div>
            </div>
          </Card>

          {/* Wallet Overview Card */}
          <Card className="p-6 bg-gradient-to-br from-emerald-800 to-brand-900 text-white border-0 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                <span>Ksheeraam Milk Wallet</span>
              </span>
              <Link to="/payments">
                <span className="text-xs text-emerald-200 underline font-semibold hover:text-white">
                  Ledger &amp; Invoices →
                </span>
              </Link>
            </div>

            <div className="text-3xl font-black font-serif">
              {formatINR(user?.walletBalance || 0)}
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed">
              Prepaid balance is automatically deducted per completed morning drop.
            </p>

            <Link to="/payments">
              <Button variant="gold" size="sm" className="w-full mt-2">
                Top Up Milk Balance
              </Button>
            </Link>
          </Card>

          {/* Delivery Preferences */}
          <Card className="p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Delivery Preferences</h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-brand-600" />
                  <div>
                    <span className="font-bold text-slate-900">Silent Morning Delivery</span>
                    <p className="text-slate-500 text-[11px]">Do not ring doorbell before 7:00 AM</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900">WhatsApp Dispatch Alerts</span>
                    <p className="text-slate-500 text-[11px]">Receive drop confirmation on WhatsApp</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600 rounded" />
              </label>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Navigation Links */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-3 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Quick Shortcuts</h4>
            <div className="space-y-2 text-xs">
              <Link
                to="/subscriptions"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>My Subscriptions</span>
                </span>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/orders"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Package className="w-4 h-4 text-brand-600" />
                  <span>Order History</span>
                </span>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/addresses"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>Delivery Addresses</span>
                </span>
                <span className="text-slate-400">→</span>
              </Link>

              <Link
                to="/payments"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-800 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Receipt className="w-4 h-4 text-brand-600" />
                  <span>Payments &amp; Invoices</span>
                </span>
                <span className="text-slate-400">→</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                className="w-full text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out of Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
