import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { BillingInvoice, PaymentReconciliationAlert } from '@/types/billing';

export const billingApi = {
  async getInvoices(): Promise<BillingInvoice[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getInvoices();
    }
    const response = await adminApiClient.get<any[]>('/admin/billing/invoices');
    return (response || []).map((inv: any) => ({
      id: inv.id || inv._id,
      invoiceNumber: inv.invoiceNumber,
      orderNumber: inv.orderNumber || (inv.orderId ? `ORD-${inv.orderId.slice(-6).toUpperCase()}` : undefined),
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      billingType: inv.billingType,
      subtotal: inv.subtotal ?? (inv.subtotalPaise ? inv.subtotalPaise / 100 : 0),
      taxAmount: inv.taxAmount ?? (inv.taxPaise ? inv.taxPaise / 100 : 0),
      totalAmount: inv.totalAmount ?? (inv.totalPaise ? inv.totalPaise / 100 : 0),
      amount: inv.totalAmount ?? (inv.totalPaise ? inv.totalPaise / 100 : 0),
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      gatewayTxnId: inv.gatewayTxnId,
      issueDate: inv.issueDate || inv.issuedAt,
      generatedAt: inv.generatedAt || inv.issuedAt,
      billingPeriod: inv.billingPeriod,
      paidAt: inv.paidAt,
      lineItems: (inv.lineItems || []).map((li: any) => ({
        description: li.description,
        units: li.units,
        rate: li.rate ?? (li.ratePaise ? li.ratePaise / 100 : 0),
        total: li.total ?? (li.totalPaise ? li.totalPaise / 100 : 0),
      })),
    }));
  },

  async getReconciliationAlerts(): Promise<PaymentReconciliationAlert[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getReconciliationAlerts();
    }
    const response = await adminApiClient.get<any[]>('/admin/billing/reconciliations');
    return (response || []).map((a: any) => ({
      id: a.id || a._id,
      referenceType: a.referenceType,
      referenceNumber: a.referenceNumber,
      customerName: a.customerName || a.customerOrAgentName,
      customerOrAgentName: a.customerOrAgentName || a.customerName,
      description: a.description || a.resolutionNotes,
      expectedAmount: a.expectedAmount ?? (a.expectedAmountPaise ? a.expectedAmountPaise / 100 : 0),
      recordedAmount: a.recordedAmount ?? (a.recordedAmountPaise ? a.recordedAmountPaise / 100 : 0),
      actualAmount: a.actualAmount ?? (a.recordedAmountPaise ? a.recordedAmountPaise / 100 : 0),
      difference: a.difference ?? (a.differencePaise ? a.differencePaise / 100 : 0),
      discrepancyAmount: a.discrepancyAmount ?? (a.differencePaise ? Math.abs(a.differencePaise) / 100 : 0),
      discrepancyType: a.discrepancyType || a.type || 'cod_shortage',
      type: a.type || a.discrepancyType,
      status: a.status,
      reportedAt: a.reportedAt || a.detectedAt || a.createdAt,
      detectedAt: a.detectedAt || a.reportedAt || a.createdAt,
      resolutionNotes: a.resolutionNotes,
    }));
  },

  async resolveAlert(id: string, notes: string): Promise<PaymentReconciliationAlert> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.resolveAlert(id, notes);
    }
    return adminApiClient.post<PaymentReconciliationAlert>(`/admin/billing/reconciliations/${id}/resolve`, { notes });
  },
};
