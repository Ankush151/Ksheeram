import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/features/billing/billingApi';
import { PaymentReconciliationAlert } from '@/types/billing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  CreditCard,
  Banknote,
} from 'lucide-react';

export const PaymentsReconciliationPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [resolvingAlert, setResolvingAlert] = useState<PaymentReconciliationAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'reconciliation-alerts'],
    queryFn: billingApi.getReconciliationAlerts,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      billingApi.resolveAlert(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reconciliation-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      setResolvingAlert(null);
      setResolutionNotes('');
    },
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !resolutionNotes.trim()) return;
    resolveMutation.mutate({ id: resolvingAlert.id, notes: resolutionNotes });
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const name = alert.customerOrAgentName || alert.customerName || '';
    const desc = alert.description || alert.resolutionNotes || '';
    const matchesSearch =
      alert.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const unresolvedCount = alerts.filter((a) => a.status === 'unresolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
            Payment Reconciliation & Discrepancies
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detect cash collection shortfalls, bank gateway settlement anomalies, and unresolved UPI transactions.
          </p>
        </div>
        {unresolvedCount > 0 && (
          <Badge variant="warning" className="px-3 py-1.5 text-xs font-semibold">
            {unresolvedCount} Pending Audit
          </Badge>
        )}
      </div>

      {/* Operational Protocol Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-semibold">Reconciliation Rule:</span> Never manually override bank ledger numbers without logging corresponding deposit slips or supervisor verification. For COD discrepancies, delivery agent bag counts must match before resolving.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Search reference #, description, agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            {(['all', 'unresolved', 'resolved'] as const).map((st) => (
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

      {/* Alerts Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load reconciliation alerts.</Alert>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
            <p className="font-medium text-slate-700">All payment accounts are balanced</p>
            <p className="text-sm mt-1">No discrepancies detected across COD or payment gateways.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Alert Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Party Involved</th>
                  <th className="py-3 px-4">Expected</th>
                  <th className="py-3 px-4">Actual</th>
                  <th className="py-3 px-4">Discrepancy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map((alert) => {
                  const isUnresolved = alert.status === 'unresolved';
                  const actual = alert.actualAmount !== undefined ? alert.actualAmount : alert.recordedAmount;
                  const diff = alert.discrepancyAmount !== undefined ? alert.discrepancyAmount : alert.difference;
                  const partyName = alert.customerOrAgentName || alert.customerName || 'N/A';
                  const category = alert.type || alert.discrepancyType || 'COD Shortage';

                  return (
                    <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {alert.referenceNumber}
                        <div className="text-xs text-slate-600 font-sans font-normal mt-0.5">
                          {alert.description || alert.resolutionNotes || 'Discrepancy reported during shift reconciliation'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {formatDate(alert.detectedAt || alert.reportedAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={category.includes('shortage') ? 'warning' : 'neutral'}
                          className="capitalize text-xs"
                        >
                          {category.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {partyName}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {formatCurrency(alert.expectedAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {formatCurrency(actual)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        {formatCurrency(diff)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={isUnresolved ? 'danger' : 'success'}
                          className="capitalize text-xs"
                        >
                          {alert.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isUnresolved ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setResolvingAlert(alert);
                              setResolutionNotes('');
                            }}
                            className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                          >
                            Resolve Alert
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      <Modal
        isOpen={Boolean(resolvingAlert)}
        onClose={() => setResolvingAlert(null)}
        title={`Reconcile Discrepancy - ${resolvingAlert?.referenceNumber}`}
      >
        {resolvingAlert && (
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Party:</span>
                <strong className="text-slate-900">
                  {resolvingAlert.customerOrAgentName || resolvingAlert.customerName}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected:</span>
                <span className="text-slate-900">{formatCurrency(resolvingAlert.expectedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actual Received:</span>
                <span className="text-slate-900">
                  {formatCurrency(
                    resolvingAlert.actualAmount !== undefined
                      ? resolvingAlert.actualAmount
                      : resolvingAlert.recordedAmount
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                <span>Discrepancy:</span>
                <span>
                  {formatCurrency(
                    resolvingAlert.discrepancyAmount !== undefined
                      ? resolvingAlert.discrepancyAmount
                      : resolvingAlert.difference
                  )}
                </span>
              </div>
            </div>

            <Input
              label="Auditor Resolution Notes & Reference"
              required
              placeholder="e.g. Cash handed over at 11 AM; bag re-counted. Bank ref: UPI-849302"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              helperText="Resolution note is permanently recorded on the settlement audit trail."
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResolvingAlert(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={resolveMutation.isPending || !resolutionNotes.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {resolveMutation.isPending ? 'Resolving...' : 'Confirm Reconciliation'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
export default PaymentsReconciliationPage;
