import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalExercises: number;
  totalFoodItems: number;
  totalWorkouts: number;
  newUsersLast7Days: Array<{ date: string; count: number }>;
  bmiDistribution: Array<{ category: string; count: number }>;
}

export function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: true; data: DashboardStats }>(
        '/api/admin/stats',
      );
      return data.data;
    },
    staleTime: 60_000,
  });
}
