'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/app/actions/products';
import type { Product } from '@/types/product';

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    staleTime: 30 * 1000,
  });
}
