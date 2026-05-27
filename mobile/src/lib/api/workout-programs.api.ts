import apiClient from './client';
import type { IWorkoutProgramSummary, IWorkoutProgram, IUserProgramProgress } from './types';

export async function listWorkoutProgramsApi(level?: string): Promise<IWorkoutProgramSummary[]> {
  const params = level ? { level } : {};
  const res = await apiClient.get('/api/workout-programs', { params });
  return (res.data.data as IWorkoutProgramSummary[]) ?? [];
}

export async function getWorkoutProgramApi(id: string): Promise<IWorkoutProgram> {
  const res = await apiClient.get(`/api/workout-programs/${id}`);
  return res.data.data as IWorkoutProgram;
}

export async function startProgramApi(programId: string): Promise<IUserProgramProgress> {
  const res = await apiClient.post(`/api/workout-programs/${programId}/start`);
  return res.data.data as IUserProgramProgress;
}
