import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '@/features/whatsapp/whatsappApi';
import { WhatsAppOrderRequest } from '@/types/whatsapp';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatDate } from '@/utils/formatters';
import {
  MessageSquare,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  MessageCircle,
  Layers,
} from 'lucide-react';

export const WhatsAppRequestsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'converted' | 'dismissed'>('all');

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'whatsapp-requests'],
    queryFn: whatsappApi.getWhatsAppRequests,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'in_progress' | 'converted' | 'dismissed' }) =>
      whatsappApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'whatsapp-requests'] });
    },
  });

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch =
      (req.customerName && req.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      req.phone.includes(searchTerm) ||
      req.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const newCount = requests.filter((r) => r.status === 'new' || r.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-emerald-600" />
            WhatsApp Orders & Inbound Inquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review conversational order requests received via the official Ksheeraam WhatsApp bot, convert into orders, or resolve inquiries.
          </p>
        </div>
        {newCount > 0 && (
          <Badge variant="warning" className="px-3 py-1.5 text-xs font-semibold">
            {newCount} Awaiting Conversion
          </Badge>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <span className="font-semibold">WhatsApp Assistant Gateway:</span> Customers often request instant milk drops or 3-day subscription pauses directly through WhatsApp. Agents can click "Chat on WhatsApp" to verify location pins or confirm schedule adjustments.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Search sender, phone, text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
            {(['all', 'new', 'in_progress', 'converted', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load WhatsApp requests.</Alert>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sender & Phone</th>
                  <th className="py-3 px-4">Requested Item</th>
                  <th className="py-3 px-4">Incoming Message</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {req.customerName || 'Anonymous Customer'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">{req.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" className="capitalize text-xs font-medium">
                          {req.requestedProduct || 'General Inquiry'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-800 border border-slate-100">
                          &ldquo;{req.message}&rdquo;
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(req.receivedAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            req.status === 'converted'
                              ? 'success'
                              : req.status === 'new'
                              ? 'warning'
                              : req.status === 'in_progress'
                              ? 'info'
                              : 'neutral'
                          }
                          className="capitalize text-xs"
                        >
                          {req.status.replace('_', ' ')}
                        </Badge>
                        {req.handledBy && (
                          <div className="text-[11px] text-slate-400 mt-0.5">By {req.handledBy}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${req.phone.replace('+', '').replace(/\s+/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors border border-emerald-200"
                          >
                            <ExternalLink className="w-3 h-3" />
                            WhatsApp
                          </a>
                          {(req.status === 'new' || req.status === 'in_progress') && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'converted' })}
                                className="text-xs bg-emerald-600 hover:bg-emerald-700"
                              >
                                Convert to Order
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'dismissed' })}
                                className="text-xs text-slate-500"
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default WhatsAppRequestsPage;
