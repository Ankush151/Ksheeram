import React, { useState } from 'react';
import { env } from '@/config/env';
import { buildWhatsAppLink } from '@/utils/formatters';
import { MessageCircle, X, ExternalLink, HelpCircle, ShoppingBag } from 'lucide-react';

export interface WhatsAppButtonProps {
  customMessage?: string;
  orderContext?: {
    productName?: string;
    size?: string;
    quantity?: number;
    address?: string;
  };
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ orderContext }) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultMsg = orderContext
    ? `Hello Ksheeraam! I would like to inquire about ordering ${orderContext.quantity || 1}x ${
        orderContext.productName || 'Milk'
      } (${orderContext.size || '1L'}) to ${orderContext.address || 'my address'}.`
    : `Hello Ksheeraam Team! I would like to learn more about your daily fresh milk delivery and subscription plans.`;

  const supportLink = buildWhatsAppLink(
    env.WHATSAPP_PHONE,
    `Hello Ksheeraam Concierge! I have a question regarding my delivery/account.`
  );

  const orderLink = buildWhatsAppLink(env.WHATSAPP_PHONE, defaultMsg);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-soft-xl border border-slate-100 overflow-hidden animate-scaleUp">
          <div className="bg-emerald-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight leading-tight">
                    Ksheeraam WhatsApp Help
                  </h4>
                  <p className="text-[11px] text-emerald-100">Usually replies in &lt; 5 mins</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
                aria-label="Close WhatsApp card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3 text-xs text-slate-600">
            <p className="text-slate-700 font-medium">
              Need assistance with an early morning drop, custom schedule, or assisted phone order?
            </p>

            <div className="space-y-2">
              <a
                href={orderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/60 font-semibold transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Assisted Milk Ordering</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 opacity-70 group-hover:opacity-100" />
              </a>

              <a
                href={supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/60 font-semibold transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>General Support &amp; Queries</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-70 group-hover:opacity-100" />
              </a>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
              * Note: Opening WhatsApp connects you to our team. An order is officially placed only after address verification and order generation by our system.
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat on WhatsApp"
        className="flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all font-semibold text-sm group"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline">WhatsApp Order &amp; Help</span>
      </button>
    </div>
  );
};
