import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Calendar, Package, User } from 'lucide-react';
import { cn } from '@/utils/cn';

export const MobileNav: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Products', icon: Compass },
    { to: '/subscriptions', label: 'Subscriptions', icon: Calendar },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/profile', label: 'Account', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-bold transition-colors min-w-[56px]',
                  isActive
                    ? 'text-brand-700'
                    : 'text-slate-500 hover:text-slate-800'
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
  );
};
