import apiClient from './client';
import type { IExercise, ICategory } from './types';

export async function listExercisesApi(category?: ICategory): Promise<IExercise[]> {
  const params = category ? { category } : undefined;
  const res = await apiClient.get<{ success: boolean; data: IExercise[] }>(
    '/api/exercises',
    params ? { params } : undefined,
  );
  return res.data.data;
}

export async function getExerciseApi(id: string): Promise<IExercise> {
  const res = await apiClient.get<{ success: boolean; data: IExercise }>(
    `/api/exercises/${id}`,
  );
  return res.data.data;
}
