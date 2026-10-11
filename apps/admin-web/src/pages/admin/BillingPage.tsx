import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/features/billing/billingApi';
import { BillingInvoice } from '@/types/billing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  Receipt,
  Search,
  FileText,
  DollarSign,
  Download,
  CreditCard,
  Wallet,
  Coins,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const BillingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<BillingInvoice | null>(null);

  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'invoices'],
    queryFn: billingApi.getInvoices,
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Aggregated totals
  const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || i.amount || 0), 0);
  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((acc, i) => acc + (i.totalAmount || i.amount || 0), 0);
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((acc, i) => acc + (i.totalAmount || i.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit customer invoices, prepaid subscription wallet debits, pay-as-you-go billing records, and tax breakdowns.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Billed (Cycle)</div>
              <div className="text-xl font-bold text-slate-900">{formatCurrency(totalBilled)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Realized Collections</div>
              <div className="text-xl font-bold text-blue-700">{formatCurrency(totalPaid)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Outstanding Balances</div>
              <div className="text-xl font-bold text-amber-700">{formatCurrency(totalPending)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Search invoice # or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            {(['all', 'paid', 'pending', 'overdue'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load invoices.</Alert>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No invoices found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {inv.invoiceNumber}
                      <div className="text-[11px] text-slate-400 font-sans">
                        Issued {formatDate(inv.generatedAt || inv.issueDate)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {inv.billingPeriod || inv.issueDate || 'October 2026 Cycle'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount || inv.amount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium capitalize text-slate-700">
                      {inv.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        className="capitalize text-[11px]"
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-xs"
                      >
                        View Statement
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATEMENT MODAL */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={`Tax Invoice Statement - ${selectedInvoice?.invoiceNumber}`}
      >
        {selectedInvoice && (
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 block">Customer</span>
                <strong className="text-slate-900 text-sm">{selectedInvoice.customerName}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Cycle</span>
                <strong className="text-slate-900">{selectedInvoice.billingPeriod || selectedInvoice.issueDate || 'October 2026'}</strong>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider">
                Statement Line Items
              </h4>
              <div className="divide-y divide-slate-100">
                {(
                  selectedInvoice.lineItems || [
                    {
                      description: 'Fresh Farm Packaged Milk Supply',
                      units: 1,
                      rate: selectedInvoice.totalAmount || selectedInvoice.amount || 0,
                      total: selectedInvoice.totalAmount || selectedInvoice.amount || 0,
                    },
                  ]
                ).map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-slate-900">{item.description}</span>
                      <span className="text-slate-500 ml-2">({item.units} units &times; {formatCurrency(item.rate)})</span>
                    </div>
                    <div className="font-mono font-medium text-slate-900">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Net Total:</span>
                <span>{formatCurrency(selectedInvoice.totalAmount || selectedInvoice.amount || 0)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
              <div className="flex justify-between items-center">
                <span>Payment Method: <strong className="capitalize">{selectedInvoice.paymentMethod}</strong></span>
                <Badge variant={selectedInvoice.status === 'paid' ? 'success' : 'warning'}>
                  {selectedInvoice.status}
                </Badge>
              </div>
              {selectedInvoice.paidAt && (
                <div className="text-[11px] text-emerald-700 mt-1">
                  Reconciled on {formatDate(selectedInvoice.paidAt)}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default BillingPage;
