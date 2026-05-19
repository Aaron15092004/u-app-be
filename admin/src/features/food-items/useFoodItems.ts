import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface FoodItem {
  _id: string;
  name: string;
  nameEn?: string;
  kcalPer100g: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  vitaminC: number;
  category?: string;
  imageUrl?: string | null;
  source: string;
  createdAt: string;
}

interface ListResponse {
  items: FoodItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function useFoodItems(page = 1, search = '') {
  return useQuery({
    queryKey: ['admin', 'food-items', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await apiClient.get<{ success: true; data: ListResponse }>(
        `/api/admin/food-items?${params}`,
      );
      return data.data;
    },
  });
}

export function useCreateFoodItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<FoodItem, '_id' | 'source' | 'createdAt'>) =>
      apiClient.post('/api/admin/food-items', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'food-items'] }),
  });
}

export function useUpdateFoodItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FoodItem> }) =>
      apiClient.patch(`/api/admin/food-items/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'food-items'] }),
  });
}

export function useDeleteFoodItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/food-items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'food-items'] }),
  });
}
