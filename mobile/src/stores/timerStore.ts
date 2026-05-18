import { create } from 'zustand';

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  remainingSeconds: number;
  exerciseId: string | null;
  start: (exerciseId: string, durationSeconds: number) => void;
  pause: () => void;
  resume: () => void;
  tick: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  isRunning: false,
  isPaused: false,
  remainingSeconds: 0,
  exerciseId: null,
  start: (exerciseId, durationSeconds) =>
    set({ isRunning: true, isPaused: false, remainingSeconds: durationSeconds, exerciseId }),
  pause: () => set({ isRunning: false, isPaused: true }),
  resume: () => set({ isRunning: true, isPaused: false }),
  tick: () => set((s) => ({ remainingSeconds: Math.max(0, s.remainingSeconds - 1) })),
  reset: () => set({ isRunning: false, isPaused: false, remainingSeconds: 0, exerciseId: null }),
}));
