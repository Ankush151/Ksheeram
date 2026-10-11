import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { env } from '@/config/env';
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  ClipboardList,
  Boxes,
  Calendar,
  ShoppingCart,
  MapPin,
  Receipt,
  CreditCard,
  MessageCircle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const AdminLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/products', label: 'Products & Sizes', icon: Package },
    { to: '/admin/suppliers', label: 'Suppliers & Farmers', icon: Truck },
    { to: '/admin/procurement', label: 'Procurement (POs)', icon: ClipboardList },
    { to: '/admin/inventory', label: 'Packaged Inventory', icon: Boxes },
    { to: '/admin/subscriptions', label: 'Subscriptions', icon: Calendar },
    { to: '/admin/orders', label: 'Orders & Allocation', icon: ShoppingCart },
    { to: '/admin/deliveries', label: 'Delivery Manifest', icon: MapPin },
    { to: '/admin/billing', label: 'Invoices & Billing', icon: Receipt },
    { to: '/admin/payments', label: 'Payment Reconciliation', icon: CreditCard },
    { to: '/admin/whatsapp', label: 'WhatsApp Requests', icon: MessageCircle },
    { to: '/admin/reports', label: 'Operational Reports', icon: BarChart3 },
    { to: '/admin/settings', label: 'Portal Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Operations Mode Indicator */}
      <div className="bg-slate-900 text-white text-xs py-1 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] font-bold tracking-wide uppercase text-slate-300">
            {env.USE_MOCK_API ? 'Mock Operations API Mode (Active)' : `Live Backend: ${env.API_BASE_URL}`}
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Targeting Express + MongoDB Server
          </span>
        </div>

        {/* Quick Role Switcher for paired testing */}
        <button
          onClick={async () => {
            await switchRole('delivery_agent');
            navigate('/delivery/manifest');
          }}
          className="text-amber-300 hover:text-amber-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
          title="Switch view to Delivery Agent (Ramesh)"
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span>Switch to Delivery Agent View</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0">
          {/* Brand Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-brand-500">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 font-serif">
                Ksheeraam
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-700">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                      isActive
                        ? 'bg-brand-50 text-brand-800 font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Mobile Bar */}
          <header className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-slate-600 rounded-lg hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <span className="font-bold text-sm text-slate-900">Ksheeraam Admin</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold',
                      isActive ? 'bg-brand-50 text-brand-800 font-bold' : 'text-slate-600'
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Page Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
