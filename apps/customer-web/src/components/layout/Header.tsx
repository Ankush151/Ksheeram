import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useCart } from '@/features/cart/CartContext';
import { formatINR } from '@/utils/formatters';
import {
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  Wallet,
  Calendar,
  Package,
  Receipt,
  MapPin,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/products', label: 'Fresh Milk & Dairy' },
    { to: '/subscriptions', label: 'My Subscriptions' },
    { to: '/orders', label: 'Daily Drops & Orders' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform">
              {/* Milk droplet logo SVG */}
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-serif flex items-center gap-1">
                Ksheeraam
                <span className="inline-block w-2 h-2 rounded-full bg-brand-500" />
              </span>
              <p className="text-[11px] text-brand-700 font-semibold tracking-wide uppercase">
                Farm Pure • Before 7 AM
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors',
                    isActive
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <Link
              to="/checkout"
              className="relative p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
              aria-label="View checkout"
            >
              <ShoppingBag className="w-5 h-5 text-brand-700" />
              <span className="hidden sm:inline text-xs font-bold text-slate-700">Checkout</span>
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {totalCount}
                </span>
              )}
            </Link>

            {/* Authenticated User or Login CTA */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pl-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all text-left"
                >
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[11px] font-semibold text-brand-700 flex items-center justify-end gap-1">
                      <Wallet className="w-3 h-3" />
                      {formatINR(user.walletBalance)}
                    </span>
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm border border-brand-200">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-soft-xl border border-slate-100 py-2 z-50 animate-scaleUp"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                        <span className="text-xs text-slate-500">Wallet Balance:</span>
                        <span className="text-xs font-extrabold text-brand-700">
                          {formatINR(user.walletBalance)}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-sm text-slate-700">
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile &amp; Wallet</span>
                      </Link>
                      <Link
                        to="/subscriptions"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>My Subscriptions</span>
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>Order History</span>
                      </Link>
                      <Link
                        to="/payments"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <Receipt className="w-4 h-4 text-slate-400" />
                        <span>Payments &amp; Invoices</span>
                      </Link>
                      <Link
                        to="/addresses"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>Delivery Addresses</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-xs"
                >
                  Join Ksheeraam
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link
                  to="/payments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  Payments &amp; Invoices
                </Link>
                <Link
                  to="/addresses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  Delivery Addresses
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  Profile &amp; Wallet ({formatINR(user?.walletBalance || 0)})
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
