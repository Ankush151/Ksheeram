import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from './subscriptionsApi';
import {
  SubscriptionQuoteRequest,
  CreateSubscriptionPayload,
  SubscriptionChangeRequest,
  SubscriptionPauseRequest,
} from '@/types/subscriptions';

export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getSubscriptions(),
  });
}

export function useSubscription(id?: string) {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: () => (id ? subscriptionsApi.getSubscriptionById(id) : Promise.reject('No id')),
    enabled: !!id,
  });
}

export function useQuoteSubscription() {
  return useMutation({
    mutationFn: (payload: SubscriptionQuoteRequest) => subscriptionsApi.quoteSubscription(payload),
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => subscriptionsApi.createSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

export function useModifySubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubscriptionChangeRequest }) =>
      subscriptionsApi.modifySubscription(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    },
  });
}

export function usePauseSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubscriptionPauseRequest }) =>
      subscriptionsApi.pauseSubscription(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.resumeSubscription(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      subscriptionsApi.cancelSubscription(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
    },
  });
}
