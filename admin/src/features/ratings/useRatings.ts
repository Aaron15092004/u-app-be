import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AdminV2AppRating } from '@/features/v2-contracts/types';

interface RatingsResponse {
  items: AdminV2AppRating[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useRatings(page = 1) {
  return useQuery({
    queryKey: ['admin', 'ratings', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const { data } = await apiClient.get<{ success: true; data: RatingsResponse }>(
        `/api/admin/ratings?${params}`,
      );
      return data.data;
    },
  });
}
