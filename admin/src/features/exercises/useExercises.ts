import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ExerciseStep {
  order: number;
  instruction: string;
  durationSeconds?: number;
}

export interface Exercise {
  _id: string;
  name: string;
  nameEn?: string;
  category: 'yoga' | 'cardio' | 'weights' | 'stretching';
  difficulty: 'easy' | 'medium' | 'hard';
  durationMinutes: number;
  caloriesBurned: number;
  imageUrl?: string | null;
  imageAssetId?: string | null;
  description?: string;
  steps: ExerciseStep[];
  isActive: boolean;
  createdAt: string;
}

interface ListResponse {
  items: Exercise[];
  total: number;
  page: number;
  totalPages: number;
}

export function useExercises(page = 1, search = '') {
  return useQuery({
    queryKey: ['admin', 'exercises', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const { data } = await apiClient.get<{ success: true; data: ListResponse }>(
        `/api/admin/exercises?${params}`,
      );
      return data.data;
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Exercise, '_id' | 'isActive' | 'createdAt'>) =>
      apiClient.post('/api/admin/exercises', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] }),
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      apiClient.patch(`/api/admin/exercises/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] }),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/exercises/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] }),
  });
}
