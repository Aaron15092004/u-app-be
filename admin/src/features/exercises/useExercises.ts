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

export interface MediaBatchAssetInput {
  publicId: string;
  url: string;
  mimeType: string;
  originalFilename?: string;
  source?: 'admin_upload' | 'bulk_import' | 'external_url';
}

export interface MediaBatchMatch {
  assetId: string;
  file: string;
  stem: string;
  status: 'exact_match' | 'unmatched';
  exercise: { _id: string; name: string } | null;
  canApply: boolean;
}

export interface MediaBatchMatchResponse {
  batchId: string;
  total: number;
  exactMatches: number;
  unmatched: number;
  matches: MediaBatchMatch[];
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

export function useMissingImageExercises(page = 1) {
  return useQuery({
    queryKey: ['admin', 'exercises', 'missing-images', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const { data } = await apiClient.get<{ success: true; data: ListResponse }>(
        `/api/admin/media-assets/missing-exercises?${params}`,
      );
      return data.data;
    },
  });
}

export function useCreateMediaBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { batchId?: string; assets: MediaBatchAssetInput[] }) => {
      const { data } = await apiClient.post<{ success: true; data: { batchId: string } }>(
        '/api/admin/media-assets/batch',
        input,
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] }),
  });
}

export function usePreviewMediaMatches() {
  return useMutation({
    mutationFn: async (batchId: string) => {
      const { data } = await apiClient.post<{ success: true; data: MediaBatchMatchResponse }>(
        '/api/admin/media-assets/match',
        { batchId },
      );
      return data.data;
    },
  });
}

export function useApplyExactMediaMatches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (batchId: string) => {
      const { data } = await apiClient.post<{ success: true; data: { applied: unknown[]; failed: unknown[] } }>(
        '/api/admin/media-assets/apply-exact',
        { batchId },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] });
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

/** Flat list of all exercises for pickers/selects — no pagination, cached 5 min. */
export function useExerciseOptions() {
  return useQuery({
    queryKey: ['admin', 'exercises', 'options'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ success: true; data: { items: Exercise[] } }>(
        '/api/admin/exercises?limit=500',
      );
      return data.data.items ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
