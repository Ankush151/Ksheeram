import React from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/config/env';
import { buildWhatsAppLink } from '@/utils/formatters';
import { ShieldCheck, Clock, Award, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const whatsappUrl = buildWhatsAppLink(
    env.WHATSAPP_PHONE,
    'Hello Ksheeraam! I have an inquiry about milk delivery.'
  );

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Delivered Before 7:00 AM</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Chilled cold-chain drops straight to your door every single morning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">24 Lab Purity Checks</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero synthetic hormones, zero antibiotics, zero preservatives.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Fair Farmer Sourcing</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Fair prices paid directly to local dairy farmers across India.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {/* Brand & Story */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-serif font-black">
                K
              </div>
              <span className="text-xl font-bold text-white font-serif">Ksheeraam</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bringing back pure, raw, farm-fresh milk the way nature intended. Procured with care, packaged in sterilized glass and eco-pouches, and delivered silently before dawn.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>FSSAI License: <span className="text-white font-mono">11223334000189</span></p>
              <p>GSTIN: <span className="text-white font-mono">29ABCDE1234F1Z5</span></p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Products &amp; Plans</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Pure Cow Milk (500ml &amp; 1L)
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Desi Gir Cow A2 Milk
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Creamy Buffalo Milk
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Vedic Bilona Cow Ghee
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  Fresh Farm Paneer &amp; Curd
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Portal */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Account &amp; Service</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/subscriptions" className="hover:text-white transition-colors">
                  Manage Active Subscriptions
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track Morning Deliveries
                </Link>
              </li>
              <li>
                <Link to="/payments" className="hover:text-white transition-colors">
                  Wallet Top-up &amp; Invoices
                </Link>
              </li>
              <li>
                <Link to="/addresses" className="hover:text-white transition-colors">
                  Delivery Addresses
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-white transition-colors">
                  Cart &amp; Express Checkout
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Get in Touch</h5>
            <div className="space-y-2.5 text-xs">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-400 hover:text-brand-300 font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp: +{env.WHATSAPP_PHONE}</span>
              </a>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                <span>support@ksheeraam.com</span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Ksheeraam Chilling &amp; Cold-Chain Center, Bengaluru, Karnataka, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Ksheeraam Dairy Private Limited. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
