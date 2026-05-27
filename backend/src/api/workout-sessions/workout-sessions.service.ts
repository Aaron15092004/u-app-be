import mongoose from 'mongoose';
import WorkoutSession from '../../models/WorkoutSession';
import UserProgramProgress from '../../models/UserProgramProgress';
import WorkoutProgram from '../../models/WorkoutProgram';

export interface CreateSessionInput {
  programId?: string;
  dayNumber?: number;
  dayTitle: string;
  exercises: Array<{
    name: string;
    category?: string;
    durationSeconds: number;
    restSeconds: number;
    order: number;
  }>;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalCompleted: number;
}

export async function getActiveSession(userId: string) {
  return WorkoutSession.findOne({ userId, status: 'in_progress' }).lean();
}

export async function createSession(userId: string, data: CreateSessionInput) {
  // Abandon any existing in-progress session first
  await WorkoutSession.updateMany(
    { userId, status: 'in_progress' },
    { $set: { status: 'abandoned' } },
  );

  const sessionData: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    dayTitle: data.dayTitle,
    exercises: data.exercises,
    status: 'in_progress',
    startedAt: new Date(),
  };

  if (data.programId) {
    sessionData.programId = new mongoose.Types.ObjectId(data.programId);
  }
  if (data.dayNumber !== undefined) {
    sessionData.dayNumber = data.dayNumber;
  }

  const session = await WorkoutSession.create(sessionData);
  return session;
}

export async function completeSession(
  userId: string,
  sessionId: string,
  totalDurationSeconds: number,
) {
  const session = await WorkoutSession.findOne({ _id: sessionId, userId });
  if (!session) {
    throw Object.assign(new Error('Không tìm thấy buổi tập'), { statusCode: 404 });
  }
  if (session.status !== 'in_progress') {
    throw Object.assign(new Error('Buổi tập không ở trạng thái đang thực hiện'), {
      statusCode: 400,
    });
  }

  const now = new Date();
  session.status = 'completed';
  session.completedAt = now;
  session.totalDurationSeconds = totalDurationSeconds;
  await session.save();

  // Advance UserProgramProgress if this session belongs to a program
  if (session.programId && session.dayNumber !== undefined) {
    const progress = await UserProgramProgress.findOne({
      userId,
      programId: session.programId,
    });

    if (progress && progress.status === 'active') {
      const dayNum = session.dayNumber;

      // Add to completedDays if not already there
      if (!progress.completedDays.includes(dayNum)) {
        progress.completedDays.push(dayNum);
      }

      // Look up total days for the program to check completion
      const program = await WorkoutProgram.findById(session.programId).select('days').lean();
      const totalDays = program ? program.days.length : 0;

      // Advance currentDay to the next uncompleted day
      progress.currentDay = dayNum + 1;
      progress.lastActiveAt = now;

      if (totalDays > 0 && progress.completedDays.length >= totalDays) {
        progress.status = 'completed';
      }

      await progress.save();
    }
  }

  return session;
}

export async function abandonSession(userId: string, sessionId: string) {
  const session = await WorkoutSession.findOne({ _id: sessionId, userId });
  if (!session) {
    throw Object.assign(new Error('Không tìm thấy buổi tập'), { statusCode: 404 });
  }
  if (session.status !== 'in_progress') {
    throw Object.assign(new Error('Buổi tập không ở trạng thái đang thực hiện'), {
      statusCode: 400,
    });
  }

  session.status = 'abandoned';
  await session.save();
  return session;
}

export async function getStreak(userId: string): Promise<StreakInfo> {
  // Fetch all completed sessions sorted descending by completedAt
  const sessions = await WorkoutSession.find(
    { userId, status: 'completed', completedAt: { $exists: true } },
    { completedAt: 1 },
  )
    .sort({ completedAt: -1 })
    .lean();

  const totalCompleted = sessions.length;

  if (totalCompleted === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, totalCompleted: 0 };
  }

  // Build a set of distinct workout dates (YYYY-MM-DD in UTC)
  const dateSet = new Set<string>();
  for (const s of sessions) {
    if (s.completedAt) {
      dateSet.add(s.completedAt.toISOString().slice(0, 10));
    }
  }

  // Sort dates ascending
  const sortedDates = Array.from(dateSet).sort();

  // Compute longest streak
  let longestStreak = 1;
  let runLength = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      runLength += 1;
      if (runLength > longestStreak) longestStreak = runLength;
    } else {
      runLength = 1;
    }
  }

  // Compute current streak (must end today or yesterday UTC)
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const lastDate = sortedDates[sortedDates.length - 1];
  let currentStreak = 0;

  if (lastDate === todayStr || lastDate === yesterdayStr) {
    // Walk backwards from the last date counting consecutive days
    currentStreak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const curr = new Date(sortedDates[i + 1]);
      const prev = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: lastDate,
    totalCompleted,
  };
}
