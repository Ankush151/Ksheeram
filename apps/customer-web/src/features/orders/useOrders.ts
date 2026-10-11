import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from './ordersApi';
import { OrderQuoteRequest, CreateOrderPayload } from '@/types/orders';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getOrders(),
  });
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => (id ? ordersApi.getOrderById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}

export function useQuoteOrder() {
  return useMutation({
    mutationFn: (payload: OrderQuoteRequest) => ordersApi.quoteOrder(payload),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
