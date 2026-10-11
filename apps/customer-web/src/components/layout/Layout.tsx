import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { ModeIndicator } from '@/components/common/ModeIndicator';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFCF7] text-slate-900 selection:bg-brand-500 selection:text-white">
      <ModeIndicator />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileNav />
    </div>
  );
};
