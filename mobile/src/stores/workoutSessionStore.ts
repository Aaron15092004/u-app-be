import { create } from 'zustand';

export interface StoreExercise {
  name: string;
  category?: string;
  durationSeconds: number;
  restSeconds: number;
  order: number;
  imageUrl?: string | null;
}

interface WorkoutSessionState {
  // session info
  sessionId: string | null;
  programId: string | null;
  dayNumber: number | null;
  dayTitle: string;
  exercises: StoreExercise[];

  // playback state
  currentIndex: number;
  phase: 'exercise' | 'rest' | 'completed';
  timeRemaining: number;
  isPaused: boolean;
  isActive: boolean;
  startedAt: number | null; // Date.now() when session started

  // actions
  startSession: (opts: {
    sessionId: string;
    programId?: string;
    dayNumber?: number;
    dayTitle: string;
    exercises: StoreExercise[];
  }) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  skipCurrent: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the next state after advancing past the current exercise index. */
function advanceToNext(
  currentIndex: number,
  exercises: StoreExercise[],
): Pick<WorkoutSessionState, 'currentIndex' | 'phase' | 'timeRemaining'> {
  const nextIndex = currentIndex + 1;
  if (nextIndex < exercises.length) {
    return {
      currentIndex: nextIndex,
      phase: 'exercise',
      timeRemaining: exercises[nextIndex].durationSeconds,
    };
  }
  return {
    currentIndex: currentIndex,
    phase: 'completed',
    timeRemaining: 0,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  // session info
  sessionId: null,
  programId: null,
  dayNumber: null,
  dayTitle: '',
  exercises: [],

  // playback state
  currentIndex: 0,
  phase: 'exercise',
  timeRemaining: 0,
  isPaused: false,
  isActive: false,
  startedAt: null,

  // ── actions ────────────────────────────────────────────────────────────────

  startSession: ({ sessionId, programId, dayNumber, dayTitle, exercises }) => {
    const firstDuration = exercises.length > 0 ? exercises[0].durationSeconds : 0;
    set({
      sessionId,
      programId: programId ?? null,
      dayNumber: dayNumber ?? null,
      dayTitle,
      exercises,
      currentIndex: 0,
      phase: 'exercise',
      timeRemaining: firstDuration,
      isPaused: false,
      isActive: true,
      startedAt: Date.now(),
    });
  },

  tick: () => {
    const { phase, timeRemaining, currentIndex, exercises, isPaused, isActive } = get();

    if (!isActive || isPaused || phase === 'completed') return;

    if (phase === 'exercise') {
      if (timeRemaining > 1) {
        set({ timeRemaining: timeRemaining - 1 });
      } else {
        // exercise time expired
        const current = exercises[currentIndex];
        if (current && current.restSeconds > 0) {
          set({ phase: 'rest', timeRemaining: current.restSeconds });
        } else {
          set(advanceToNext(currentIndex, exercises));
        }
      }
      return;
    }

    if (phase === 'rest') {
      if (timeRemaining > 1) {
        set({ timeRemaining: timeRemaining - 1 });
      } else {
        set(advanceToNext(currentIndex, exercises));
      }
    }
  },

  pause: () => set({ isPaused: true }),

  resume: () => set({ isPaused: false }),

  skipCurrent: () => {
    const { phase, currentIndex, exercises } = get();

    if (phase === 'exercise') {
      const current = exercises[currentIndex];
      if (current && current.restSeconds > 0) {
        set({ phase: 'rest', timeRemaining: current.restSeconds });
      } else {
        set(advanceToNext(currentIndex, exercises));
      }
      return;
    }

    if (phase === 'rest') {
      set(advanceToNext(currentIndex, exercises));
    }
  },

  reset: () =>
    set({
      sessionId: null,
      programId: null,
      dayNumber: null,
      dayTitle: '',
      exercises: [],
      currentIndex: 0,
      phase: 'exercise',
      timeRemaining: 0,
      isPaused: false,
      isActive: false,
      startedAt: null,
    }),
}));
