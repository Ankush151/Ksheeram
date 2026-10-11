import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { env } from '@/config/env';
import {
  ClipboardList,
  CheckCircle2,
  User,
  LogOut,
  Truck,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const DeliveryLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navTabs = [
    { to: '/delivery/manifest', label: 'My Route Drops', icon: ClipboardList },
    { to: '/delivery/history', label: 'Completed Drops', icon: CheckCircle2 },
    { to: '/delivery/profile', label: 'Rider Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 pb-20 sm:pb-0">
      {/* Top Bar for Agent */}
      <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Ksheeraam Delivery Partner</h1>
              <p className="text-[10px] text-emerald-400 font-semibold truncate max-w-[200px]">
                {user?.assignedRoute || 'Morning Route Active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await switchRole('admin');
                navigate('/admin/dashboard');
              }}
              className="text-amber-300 hover:text-amber-200 text-[10px] font-bold flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg"
              title="Switch to Admin Console"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Admin Mode</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Delivery Screen Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4">
        <Outlet />
      </main>

      {/* Bottom Sticky Tab Bar for Mobile Delivery Agent */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-bold transition-colors',
                    isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800'
                  )
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
