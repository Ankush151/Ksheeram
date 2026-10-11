import React, { useState } from 'react';
import { usePayments, useInvoices, useRechargeWallet } from '@/features/payments/usePayments';
import { useAuth } from '@/features/auth/AuthContext';
import { formatINR, formatDate, formatDateTime } from '@/utils/formatters';
import { Invoice } from '@/types/payments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  Wallet,
  Receipt,
  Plus,
  ArrowUpRight,
  Download,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  X,
  Printer,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: payments, isLoading: loadingPayments } = usePayments();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const rechargeMutation = useRechargeWallet();

  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices'>('transactions');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Wallet Recharge Modal
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState<number>(1000);

  const handleRecharge = async () => {
    try {
      await rechargeMutation.mutateAsync({
        amount: rechargeAmount,
        paymentMethod: 'upi',
      });
      setIsRechargeOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Wallet recharge failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" size="sm">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'failed':
        return <Badge variant="danger" size="sm">Failed</Badge>;
      case 'refunded':
        return <Badge variant="info" size="sm">Refunded</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Page Header */}
      <div>
        <Badge variant="emerald" size="md">
          Billing &amp; Wallet
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
          Payments &amp; Invoices
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your morning delivery transactions, download GST invoices, and top up your milk balance.
        </p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="p-6 bg-gradient-to-r from-emerald-800 to-brand-850 text-white rounded-3xl border-0 shadow-soft-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4" />
            <span>Ksheeraam Milk Wallet Balance</span>
          </span>
          <div className="text-3xl sm:text-4xl font-black font-serif">
            {formatINR(user?.walletBalance || 0)}
          </div>
          <p className="text-xs text-emerald-100 max-w-md">
            Deducted automatically on each delivered morning drop. Zero hassle, pause or resume anytime.
          </p>
        </div>

        <Button
          variant="gold"
          size="lg"
          onClick={() => setIsRechargeOpen(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Top-up Milk Wallet
        </Button>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            'py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'transactions'
              ? 'border-brand-600 text-brand-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment History ({payments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={cn(
            'py-3 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2',
            activeTab === 'invoices'
              ? 'border-brand-600 text-brand-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>GST Invoices ({invoices?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Transactions */}
      {activeTab === 'transactions' && (
        <Card className="p-0 overflow-hidden border border-slate-200">
          {loadingPayments ? (
            <LoadingState message="Fetching payments ledger..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-4">Transaction / Date</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments?.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-medium text-slate-900">
                        <div>{txn.transactionNumber}</div>
                        <span className="text-[11px] text-slate-400 font-sans block">
                          {formatDateTime(txn.createdAt)}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{txn.description}</td>
                      <td className="p-4 text-slate-600">{txn.method}</td>
                      <td className="p-4">{getStatusBadge(txn.status)}</td>
                      <td className="p-4 text-right font-extrabold text-slate-900">
                        {formatINR(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingInvoices ? (
            <div className="col-span-2">
              <LoadingState message="Fetching official GST invoices..." />
            </div>
          ) : (
            invoices?.map((inv) => (
              <Card
                key={inv.id}
                hoverEffect
                className="p-5 border border-slate-200 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand-600" />
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      {inv.invoiceNumber}
                    </span>
                    <Badge variant="success" size="sm">
                      {inv.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Issued: {formatDate(inv.issueDate)} • FSSAI: {inv.fssaiNumber}
                  </p>
                  <p className="text-xs font-extrabold text-brand-700 mt-2">
                    {formatINR(inv.totalAmount)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInvoice(inv)}
                  leftIcon={<Receipt className="w-3.5 h-3.5" />}
                >
                  View Invoice
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Invoice Viewer Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Tax Invoice"
        maxWidth="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6 pt-2 text-xs text-slate-700">
            {/* Invoice Top Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-serif font-extrabold text-xl text-slate-900">Ksheeraam Dairy</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  FSSAI License: {selectedInvoice.fssaiNumber}
                </p>
                <p className="text-slate-500 text-[11px]">GSTIN: {selectedInvoice.gstin}</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-slate-900">
                  {selectedInvoice.invoiceNumber}
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Date: {formatDate(selectedInvoice.issueDate)}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">Billed To:</span>
              <p className="font-semibold text-slate-800">{selectedInvoice.customerName}</p>
              <p className="text-slate-600">{selectedInvoice.billingAddress}</p>
              <p className="text-slate-500 mt-1">Phone: {selectedInvoice.customerPhone}</p>
            </div>

            {/* Line Items */}
            <div className="divide-y divide-slate-100 border-y border-slate-200">
              <div className="py-2 flex justify-between font-bold text-slate-900 uppercase text-[10px]">
                <span>Description</span>
                <span>Total</span>
              </div>
              {selectedInvoice.items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{item.description}</span>
                    <span className="text-slate-400 block text-[11px]">
                      Qty: {item.quantity} × {formatINR(item.unitPrice)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{formatINR(item.total)}</span>
                </div>
              ))}
            </div>

            {/* Total Calculation */}
            <div className="space-y-1.5 text-right font-medium">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">{formatINR(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (0% on Raw Milk):</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-brand-700">{formatINR(selectedInvoice.totalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Invoice
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Top-up Modal */}
      <Modal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        title="Recharge Milk Wallet"
        description="Top up your wallet balance for seamless early morning deliveries."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setRechargeAmount(amt)}
                className={cn(
                  'py-3 rounded-xl border text-sm font-bold transition-all',
                  rechargeAmount === amt
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                +₹{amt}
              </button>
            ))}
          </div>

          <Input
            label="Custom Amount (₹)"
            type="number"
            min={100}
            step={50}
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(Number(e.target.value))}
            prefixText="₹"
            hint="Minimum recharge amount is ₹100"
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={() => setIsRechargeOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={rechargeMutation.isPending}
              onClick={handleRecharge}
            >
              Pay {formatINR(rechargeAmount)} via UPI
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
