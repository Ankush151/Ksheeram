import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from './paymentsApi';
import { WalletRechargePayload } from '@/types/payments';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.getPayments(),
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => paymentsApi.getInvoices(),
  });
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => (id ? paymentsApi.getInvoiceById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}

export function useRechargeWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WalletRechargePayload) => paymentsApi.rechargeWallet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
