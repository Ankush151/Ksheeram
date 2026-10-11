import { useQuery } from '@tanstack/react-query';
import { productsApi } from './productsApi';

export function useProducts(category?: string, search?: string) {
  return useQuery({
    queryKey: ['products', category, search],
    queryFn: () => productsApi.getProducts(category, search),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => (slug ? productsApi.getProductBySlug(slug) : Promise.reject('No slug')),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
