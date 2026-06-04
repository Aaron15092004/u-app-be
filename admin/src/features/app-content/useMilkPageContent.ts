import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AdminV2MilkPageContent } from '@/features/v2-contracts/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface UpdateMilkPageContentInput {
  milkImages?: Record<string, string | null>;
  download?: Partial<AdminV2MilkPageContent['download']>;
}

const QUERY_KEY = ['admin', 'app-content', 'milk-page'];

export function useMilkPageContent() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AdminV2MilkPageContent>>(
        '/api/admin/app-content/milk-page',
      );
      return data.data;
    },
  });
}

export function useUpdateMilkPageContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateMilkPageContentInput) => {
      const { data } = await apiClient.patch<ApiResponse<AdminV2MilkPageContent>>(
        '/api/admin/app-content/milk-page',
        payload,
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}
