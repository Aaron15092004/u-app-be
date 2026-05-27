import WorkoutProgram from '../../models/WorkoutProgram';
import UserProgramProgress, {
  IUserProgramProgress,
} from '../../models/UserProgramProgress';
import Exercise from '../../models/Exercise';
import mongoose from 'mongoose';

export async function listPrograms(level?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
    filter.level = level;
  }
  const programs = await WorkoutProgram.find(filter, { days: 0 }).lean();
  return programs.map((p) => ({
    _id: p._id,
    title: p.title,
    titleEn: p.titleEn,
    level: p.level,
    description: p.description,
    imageUrl: p.imageUrl,
    totalDays: 0, // will compute below
    estimatedWeeks: p.estimatedWeeks,
  }));
}

export async function listProgramsWithDayCount(level?: string, userId?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (level && ['beginner', 'intermediate', 'advanced'].includes(level)) {
    filter.level = level;
  }
  const programs = await WorkoutProgram.find(filter).lean();

  // Fetch user progress if userId provided
  let progressMap: Map<string, IUserProgramProgress> = new Map();
  if (userId) {
    const progressList = await UserProgramProgress.find({ userId }).lean();
    for (const p of progressList) {
      progressMap.set(String(p.programId), p as unknown as IUserProgramProgress);
    }
  }

  return programs.map((p) => {
    const totalDurationSeconds = p.days.reduce((total, day) => {
      return (
        total + day.exercises.reduce((s, e) => s + e.durationSeconds + e.restSeconds, 0)
      );
    }, 0);
    const avgDayMinutes =
      p.days.length > 0 ? Math.round(totalDurationSeconds / p.days.length / 60) : 0;

    const userProgress = userId ? (progressMap.get(String(p._id)) ?? null) : undefined;

    return {
      _id: p._id,
      title: p.title,
      titleEn: p.titleEn,
      level: p.level,
      description: p.description,
      imageUrl: p.imageUrl,
      totalDays: p.days.length,
      estimatedWeeks: p.estimatedWeeks,
      avgDayMinutes,
      ...(userId !== undefined ? { userProgress } : {}),
    };
  });
}

export async function getProgramById(id: string, userId?: string) {
  const program = await WorkoutProgram.findById(id).lean();
  if (!program) return null;

  // Batch-fetch imageUrl for all linked Exercise documents
  const exerciseIds = program.days
    .flatMap((d) => d.exercises)
    .filter((e) => e.exerciseId)
    .map((e) => e.exerciseId!);

  const imageMap = new Map<string, string>();
  if (exerciseIds.length > 0) {
    const exDocs = await Exercise.find({ _id: { $in: exerciseIds } }, { imageUrl: 1 }).lean();
    for (const ex of exDocs) {
      if (ex.imageUrl) imageMap.set(String(ex._id), ex.imageUrl);
    }
  }

  const daysWithMeta = program.days.map((day) => {
    const totalSeconds = day.exercises.reduce(
      (s, e) => s + e.durationSeconds + e.restSeconds,
      0,
    );
    return {
      ...day,
      exercises: day.exercises.map((e) => ({
        ...e,
        imageUrl: e.exerciseId ? (imageMap.get(String(e.exerciseId)) ?? null) : null,
      })),
      totalDurationSeconds: totalSeconds,
      totalDurationMinutes: Math.ceil(totalSeconds / 60),
    };
  });

  let userProgress: IUserProgramProgress | null | undefined = undefined;
  if (userId) {
    userProgress =
      (await UserProgramProgress.findOne({ userId, programId: id }).lean()) as
        | IUserProgramProgress
        | null;
  }

  return {
    _id: program._id,
    title: program.title,
    titleEn: program.titleEn,
    level: program.level,
    description: program.description,
    imageUrl: program.imageUrl,
    totalDays: program.days.length,
    estimatedWeeks: program.estimatedWeeks,
    days: daysWithMeta,
    ...(userId !== undefined ? { userProgress: userProgress ?? null } : {}),
  };
}

export async function startProgram(
  userId: string,
  programId: string,
): Promise<IUserProgramProgress> {
  const program = await WorkoutProgram.findById(programId).select('_id').lean();
  if (!program) {
    throw Object.assign(new Error('Không tìm thấy chương trình tập'), { statusCode: 404 });
  }

  const now = new Date();

  // Upsert: create if not exists, reactivate if paused/completed
  const existing = await UserProgramProgress.findOne({ userId, programId });

  if (existing) {
    // Reactivate regardless of current status
    existing.status = 'active';
    existing.currentDay = 1;
    existing.completedDays = [];
    existing.startedAt = now;
    existing.lastActiveAt = now;
    await existing.save();
    return existing;
  }

  const progress = await UserProgramProgress.create({
    userId: new mongoose.Types.ObjectId(userId),
    programId: new mongoose.Types.ObjectId(programId),
    currentDay: 1,
    completedDays: [],
    status: 'active',
    startedAt: now,
    lastActiveAt: now,
  });

  return progress;
}

// Seeds default programs once if collection is empty
export async function seedDefaultsIfEmpty() {
  const count = await WorkoutProgram.countDocuments();
  if (count > 0) return;

  await WorkoutProgram.insertMany([
    {
      title: 'Khởi đầu khoẻ mạnh',
      titleEn: 'Healthy Start',
      level: 'beginner',
      description:
        'Chương trình dành cho người mới bắt đầu. Xây dựng nền tảng thể lực vững chắc trong 7 ngày.',
      estimatedWeeks: 1,
      days: [
        {
          dayNumber: 1,
          title: 'Khởi động toàn thân',
          exercises: [
            {
              exerciseName: 'Nhảy tại chỗ',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 15,
              order: 1,
            },
            {
              exerciseName: 'Squat cơ bản',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Gập bụng',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 3,
            },
            {
              exerciseName: 'Plank',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 4,
            },
            {
              exerciseName: 'Giãn cơ toàn thân',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 5,
            },
          ],
        },
        {
          dayNumber: 2,
          title: 'Cơ đùi & chân',
          exercises: [
            {
              exerciseName: 'Lunges',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Side lunges',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Calf raises',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 3,
            },
            {
              exerciseName: 'Wall sit',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 4,
            },
            {
              exerciseName: 'Giãn cơ đùi',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 5,
            },
          ],
        },
        {
          dayNumber: 3,
          title: 'Vai & cánh tay',
          exercises: [
            {
              exerciseName: 'Push-ups cơ bản',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Shoulder taps',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 2,
            },
            {
              exerciseName: 'Arm circles',
              category: 'weights',
              durationSeconds: 20,
              restSeconds: 10,
              order: 3,
            },
            {
              exerciseName: 'Giãn cơ vai',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 4,
            },
          ],
        },
        {
          dayNumber: 4,
          title: 'Phục hồi & yoga nhẹ',
          exercises: [
            {
              exerciseName: 'Cat-Cow',
              category: 'yoga',
              durationSeconds: 60,
              restSeconds: 10,
              order: 1,
            },
            {
              exerciseName: "Child's pose",
              category: 'yoga',
              durationSeconds: 60,
              restSeconds: 10,
              order: 2,
            },
            {
              exerciseName: 'Hip flexor stretch',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 10,
              order: 3,
            },
            {
              exerciseName: 'Spinal twist',
              category: 'yoga',
              durationSeconds: 60,
              restSeconds: 0,
              order: 4,
            },
          ],
        },
        {
          dayNumber: 5,
          title: 'Cardio nhẹ',
          exercises: [
            {
              exerciseName: 'Jumping jacks',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 15,
              order: 1,
            },
            {
              exerciseName: 'High knees',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 15,
              order: 2,
            },
            {
              exerciseName: 'Butt kicks',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 15,
              order: 3,
            },
            {
              exerciseName: 'Mountain climbers',
              category: 'cardio',
              durationSeconds: 30,
              restSeconds: 20,
              order: 4,
            },
            {
              exerciseName: 'Cool down giãn cơ',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 5,
            },
          ],
        },
        {
          dayNumber: 6,
          title: 'Core & bụng',
          exercises: [
            {
              exerciseName: 'Crunches',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 1,
            },
            {
              exerciseName: 'Bicycle crunches',
              category: 'cardio',
              durationSeconds: 30,
              restSeconds: 15,
              order: 2,
            },
            {
              exerciseName: 'Leg raises',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 3,
            },
            {
              exerciseName: 'Russian twists',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 4,
            },
            {
              exerciseName: 'Plank dài',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 15,
              order: 5,
            },
            {
              exerciseName: 'Giãn cơ lưng',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 6,
            },
          ],
        },
        {
          dayNumber: 7,
          title: 'Tổng hợp & kết thúc tuần',
          exercises: [
            {
              exerciseName: 'Khởi động tổng hợp',
              category: 'cardio',
              durationSeconds: 120,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Squat',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Push-ups',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 20,
              order: 3,
            },
            {
              exerciseName: 'Lunges',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 20,
              order: 4,
            },
            {
              exerciseName: 'Plank',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Jumping jacks',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Cool down',
              category: 'stretching',
              durationSeconds: 120,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
      ],
    },
    {
      title: 'Nâng cấp sức mạnh',
      titleEn: 'Strength Builder',
      level: 'intermediate',
      description:
        'Chương trình 2 tuần cho người đã có nền tảng. Tăng cường sức mạnh và sức bền toàn thân.',
      estimatedWeeks: 2,
      days: [
        {
          dayNumber: 1,
          title: 'Push & Pull ngày 1',
          exercises: [
            {
              exerciseName: 'Warm-up cardio',
              category: 'cardio',
              durationSeconds: 90,
              restSeconds: 15,
              order: 1,
            },
            {
              exerciseName: 'Push-ups nâng cao',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Wide push-ups',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 20,
              order: 3,
            },
            {
              exerciseName: 'Diamond push-ups',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 25,
              order: 4,
            },
            {
              exerciseName: 'Pike push-ups',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Superman',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Giãn cơ vai & ngực',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
        {
          dayNumber: 2,
          title: 'Legs & Core ngày 1',
          exercises: [
            {
              exerciseName: 'Jump squats',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Squat pulse',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Reverse lunges',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 20,
              order: 3,
            },
            {
              exerciseName: 'Glute bridge',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 15,
              order: 4,
            },
            {
              exerciseName: 'Plank shoulder tap',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Side plank',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 15,
              order: 6,
            },
            {
              exerciseName: 'Giãn cơ đùi & lưng',
              category: 'stretching',
              durationSeconds: 60,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
        {
          dayNumber: 3,
          title: 'Cardio & Agility',
          exercises: [
            {
              exerciseName: 'Jump rope simulation',
              category: 'cardio',
              durationSeconds: 60,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Burpees',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 25,
              order: 2,
            },
            {
              exerciseName: 'Speed skaters',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 20,
              order: 3,
            },
            {
              exerciseName: 'Box jumps tại chỗ',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 25,
              order: 4,
            },
            {
              exerciseName: 'Mountain climbers nhanh',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Cool down yoga',
              category: 'yoga',
              durationSeconds: 90,
              restSeconds: 0,
              order: 6,
            },
          ],
        },
        {
          dayNumber: 4,
          title: 'Recovery & Mobility',
          exercises: [
            {
              exerciseName: 'Sun salutation',
              category: 'yoga',
              durationSeconds: 120,
              restSeconds: 15,
              order: 1,
            },
            {
              exerciseName: 'Pigeon pose',
              category: 'yoga',
              durationSeconds: 60,
              restSeconds: 10,
              order: 2,
            },
            {
              exerciseName: 'Warrior I & II',
              category: 'yoga',
              durationSeconds: 90,
              restSeconds: 10,
              order: 3,
            },
            {
              exerciseName: 'Deep breathing',
              category: 'yoga',
              durationSeconds: 60,
              restSeconds: 0,
              order: 4,
            },
          ],
        },
        {
          dayNumber: 5,
          title: 'Full Body Strength',
          exercises: [
            {
              exerciseName: 'Inchworm',
              category: 'weights',
              durationSeconds: 60,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Bulgarian split squat',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 25,
              order: 2,
            },
            {
              exerciseName: 'Push-ups + rotation',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 3,
            },
            {
              exerciseName: 'Glute bridge march',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 4,
            },
            {
              exerciseName: 'Bear crawl',
              category: 'cardio',
              durationSeconds: 30,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Dead bug',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Giãn cơ cuối buổi',
              category: 'stretching',
              durationSeconds: 90,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
      ],
    },
    {
      title: 'Thử thách đỉnh cao',
      titleEn: 'Peak Challenge',
      level: 'advanced',
      description:
        'Chương trình 3 tuần cường độ cao. Dành cho người có thể lực tốt, muốn phá vỡ giới hạn bản thân.',
      estimatedWeeks: 3,
      days: [
        {
          dayNumber: 1,
          title: 'HIIT Đốt mỡ',
          exercises: [
            {
              exerciseName: 'Dynamic warm-up',
              category: 'cardio',
              durationSeconds: 120,
              restSeconds: 15,
              order: 1,
            },
            {
              exerciseName: 'Burpee pull-through',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Tuck jumps',
              category: 'cardio',
              durationSeconds: 30,
              restSeconds: 25,
              order: 3,
            },
            {
              exerciseName: 'Plyo push-ups',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 25,
              order: 4,
            },
            {
              exerciseName: 'Jump lunges',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Sprint tại chỗ',
              category: 'cardio',
              durationSeconds: 30,
              restSeconds: 30,
              order: 6,
            },
            {
              exerciseName: 'V-ups',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 20,
              order: 7,
            },
            {
              exerciseName: 'Cool down',
              category: 'stretching',
              durationSeconds: 90,
              restSeconds: 0,
              order: 8,
            },
          ],
        },
        {
          dayNumber: 2,
          title: 'Sức mạnh cơ trên',
          exercises: [
            {
              exerciseName: 'Archer push-ups',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 25,
              order: 1,
            },
            {
              exerciseName: 'Pike push-ups nâng',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 25,
              order: 2,
            },
            {
              exerciseName: 'Staggered push-ups',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 25,
              order: 3,
            },
            {
              exerciseName: 'Pseudo planche',
              category: 'weights',
              durationSeconds: 20,
              restSeconds: 30,
              order: 4,
            },
            {
              exerciseName: 'Tricep dips nâng cao',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Shoulder press hold',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Giãn cơ ngực & vai',
              category: 'stretching',
              durationSeconds: 90,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
        {
          dayNumber: 3,
          title: 'Legs Power',
          exercises: [
            {
              exerciseName: 'Pistol squat hỗ trợ',
              category: 'weights',
              durationSeconds: 45,
              restSeconds: 30,
              order: 1,
            },
            {
              exerciseName: 'Jump squat series',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 25,
              order: 2,
            },
            {
              exerciseName: 'Nordic curl',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 30,
              order: 3,
            },
            {
              exerciseName: 'Single leg glute bridge',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 4,
            },
            {
              exerciseName: 'Lateral band walk',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Step-up với nhảy',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Giãn cơ chân sâu',
              category: 'stretching',
              durationSeconds: 90,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
        {
          dayNumber: 4,
          title: 'Core đỉnh cao',
          exercises: [
            {
              exerciseName: 'Dragon flag progression',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 30,
              order: 1,
            },
            {
              exerciseName: 'Hollow body hold',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 25,
              order: 2,
            },
            {
              exerciseName: 'L-sit progression',
              category: 'weights',
              durationSeconds: 20,
              restSeconds: 30,
              order: 3,
            },
            {
              exerciseName: 'Ab wheel rollout',
              category: 'weights',
              durationSeconds: 30,
              restSeconds: 25,
              order: 4,
            },
            {
              exerciseName: 'Hanging knee raises',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'Plank variations',
              category: 'weights',
              durationSeconds: 60,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Yoga phục hồi',
              category: 'yoga',
              durationSeconds: 120,
              restSeconds: 0,
              order: 7,
            },
          ],
        },
        {
          dayNumber: 5,
          title: 'Full Body Endurance',
          exercises: [
            {
              exerciseName: 'Complex warm-up',
              category: 'cardio',
              durationSeconds: 120,
              restSeconds: 20,
              order: 1,
            },
            {
              exerciseName: 'Burpee + push-up',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 20,
              order: 2,
            },
            {
              exerciseName: 'Jump squat + lunge',
              category: 'cardio',
              durationSeconds: 45,
              restSeconds: 20,
              order: 3,
            },
            {
              exerciseName: 'Push-up + rotation',
              category: 'weights',
              durationSeconds: 40,
              restSeconds: 20,
              order: 4,
            },
            {
              exerciseName: 'Mountain climber fast',
              category: 'cardio',
              durationSeconds: 40,
              restSeconds: 20,
              order: 5,
            },
            {
              exerciseName: 'V-up + twist',
              category: 'weights',
              durationSeconds: 35,
              restSeconds: 20,
              order: 6,
            },
            {
              exerciseName: 'Sprint final',
              category: 'cardio',
              durationSeconds: 30,
              restSeconds: 30,
              order: 7,
            },
            {
              exerciseName: 'Full body cool down',
              category: 'stretching',
              durationSeconds: 120,
              restSeconds: 0,
              order: 8,
            },
          ],
        },
      ],
    },
  ]);
}
