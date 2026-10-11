import { apiClient } from '@/services/api-client';
import { mockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { PaymentTransaction, Invoice, WalletRechargePayload } from '@/types/payments';
import { User } from '@/types/auth';

function mapTransaction(p: any): PaymentTransaction {
  return {
    id: p.id || p._id,
    transactionNumber: p.entryNumber || p.paymentNumber || p.id,
    orderId: p.orderId,
    amount: p.amountPaise !== undefined ? p.amountPaise / 100 : (p.amount || 0),
    currency: 'INR',
    status: (p.status || 'paid') as any,
    method: p.transactionType || p.method || 'Prepaid Wallet',
    gateway: 'razorpay',
    description: p.description || 'Prepaid Milk Ledger Transaction',
    invoiceNumber: p.invoiceNumber || p.entryNumber || 'INV-REC',
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

function mapInvoice(inv: any): Invoice {
  const items = (inv.lineItems || []).map((li: any) => ({
    description: li.description || 'Packaged Milk',
    quantity: li.units || 1,
    unitPrice: li.ratePaise !== undefined ? li.ratePaise / 100 : (li.rate || 68),
    total: li.totalPaise !== undefined ? li.totalPaise / 100 : (li.total || 68),
  }));

  return {
    id: inv.id || inv._id,
    invoiceNumber: inv.invoiceNumber,
    orderId: inv.orderId,
    subscriptionId: inv.subscriptionId,
    issueDate: inv.issuedAt || inv.createdAt || new Date().toISOString().split('T')[0],
    dueDate: inv.issuedAt || new Date().toISOString().split('T')[0],
    customerName: inv.customerName || 'Customer',
    customerEmail: 'customer@ksheeraam.com',
    customerPhone: inv.customerPhone || '9876543212',
    billingAddress: 'Bengaluru, Karnataka',
    items,
    subtotal: inv.subtotalPaise !== undefined ? inv.subtotalPaise / 100 : (inv.subtotal || 0),
    taxAmount: 0,
    deliveryFee: 0,
    totalAmount: inv.totalPaise !== undefined ? inv.totalPaise / 100 : (inv.total || 0),
    status: (inv.status || 'paid') as any,
    paymentMethod: inv.paymentMethod || 'Wallet',
    fssaiNumber: '11223344556677',
    gstin: '29AAAAA0000A1Z5',
  };
}

export const paymentsApi = {
  async getPayments(): Promise<PaymentTransaction[]> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getPayments();
    }
    const res = await apiClient.get<any[]>('/payments');
    return (res || []).map(mapTransaction);
  },

  async getInvoices(): Promise<Invoice[]> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getInvoices();
    }
    const res = await apiClient.get<any[]>('/invoices');
    return (res || []).map(mapInvoice);
  },

  async getInvoiceById(id: string): Promise<Invoice> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getInvoiceById(id);
    }
    const res = await apiClient.get<any>(`/invoices/${id}`);
    return mapInvoice(res);
  },

  async rechargeWallet(payload: WalletRechargePayload): Promise<{ user: User; transaction: PaymentTransaction }> {
    if (env.USE_MOCK_API) {
      return mockHandlers.rechargeWallet(payload);
    }
    const reqBody = {
      amountPaise: Math.round(payload.amount * 100),
      paymentMethod: payload.paymentMethod || 'upi',
    };
    const res = await apiClient.post<any>('/payments/wallet-recharge', reqBody);
    const newBal = (res.newBalancePaise !== undefined ? res.newBalancePaise / 100 : payload.amount);

    const user: User = {
      id: '',
      name: '',
      email: '',
      phone: '',
      walletBalance: newBal,
      isSubscribed: true,
      createdAt: new Date().toISOString(),
    };

    const transaction = mapTransaction(res.payment || { amountPaise: reqBody.amountPaise });
    return { user, transaction };
  },
};
