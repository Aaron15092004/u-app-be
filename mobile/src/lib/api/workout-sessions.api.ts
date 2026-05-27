import apiClient from './client';
import type { IWorkoutSession, IWorkoutStreak, ISessionExercise } from './types';

export async function getActiveSessionApi(): Promise<IWorkoutSession | null> {
  const res = await apiClient.get('/api/workout-sessions/active');
  return (res.data.data as IWorkoutSession | null) ?? null;
}

export async function createSessionApi(data: {
  programId?: string;
  dayNumber?: number;
  dayTitle: string;
  exercises: ISessionExercise[];
}): Promise<IWorkoutSession> {
  const res = await apiClient.post('/api/workout-sessions', data);
  return res.data.data as IWorkoutSession;
}

export async function completeSessionApi(
  sessionId: string,
  totalDurationSeconds: number,
): Promise<void> {
  await apiClient.post(`/api/workout-sessions/${sessionId}/complete`, {
    totalDurationSeconds,
  });
}

export async function abandonSessionApi(sessionId: string): Promise<void> {
  await apiClient.post(`/api/workout-sessions/${sessionId}/abandon`);
}

export async function getWorkoutStreakApi(): Promise<IWorkoutStreak> {
  const res = await apiClient.get('/api/workout-sessions/streak');
  return res.data.data as IWorkoutStreak;
}
