import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ProgramExercise {
  exerciseId?: string;
  exerciseName: string;
  category?: string;
  durationSeconds: number;
  restSeconds: number;
  order: number;
}

export interface ProgramDay {
  dayNumber: number;
  title: string;
  exercises: ProgramExercise[];
}

export interface Program {
  _id: string;
  title: string;
  titleEn?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  imageUrl?: string | null;
  estimatedWeeks: number;
  days: ProgramDay[];     // full array when editing; may be empty on list view
  totalDays?: number;     // returned by list endpoint instead of full days array
  isActive: boolean;
  createdAt: string;
}

export type ProgramInput = Omit<Program, '_id' | 'createdAt'>;

export function usePrograms(search = '') {
  return useQuery({
    queryKey: ['admin', 'programs', search],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Program[] }>('/api/admin/programs');
      const items = data.data ?? [];
      if (!search) return items;
      const q = search.toLowerCase();
      return items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    },
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProgramInput) =>
      apiClient.post<{ data: Program }>('/api/admin/programs', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] }),
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProgramInput> }) =>
      apiClient.patch<{ data: Program }>(`/api/admin/programs/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] }),
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/admin/programs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] }),
  });
}

export function useUploadProgramImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('image', file);
      const { data } = await apiClient.post<{ data: { url: string } }>(
        `/api/admin/programs/${id}/image`,
        form,
      );
      return data.data.url;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] }),
  });
}
