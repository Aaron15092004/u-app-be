import mongoose, { PipelineStage } from 'mongoose';
import BMIRecord from '../../models/BMIRecord';
import User from '../../models/User';
import { vietnamDayStart } from '../../utils/date';

// ---------------------------------------------------------------------------
// Pure computation helpers (exported for unit tests)
// ---------------------------------------------------------------------------

export function computeBMI(heightCm: number, weightKg: number): number {
  return Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
}

export function categorizeBMI(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// ---------------------------------------------------------------------------
// saveBMIAtomic — creates BMIRecord AND updates User.profile atomically (D-54)
// Falls back to sequential save if MongoDB does not support transactions
// (e.g., standalone instance used in tests with MongoMemoryServer)
// ---------------------------------------------------------------------------

export async function saveBMIAtomic(
  userId: string,
  heightCm: number,
  weightKg: number,
): Promise<{ bmiRecord: object; user: { heightCm: number; weightKg: number } }> {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const bmi = computeBMI(heightCm, weightKg);
  const category = categorizeBMI(bmi);
  const now = new Date();

  const session = await mongoose.startSession();
  try {
    let bmiRecord: object | undefined;
    let updatedUser: { profile: { heightCm?: number; weightKg?: number } } | null = null;

    await session.withTransaction(async () => {
      const created = await BMIRecord.create(
        [{ userId: userObjId, heightCm, weightKg, bmi, category, recordedAt: now }],
        { session },
      );
      bmiRecord = created[0].toObject();

      updatedUser = await User.findByIdAndUpdate(
        userObjId,
        { 'profile.heightCm': heightCm, 'profile.weightKg': weightKg },
        { new: true, runValidators: true, session },
      )
        .select('profile')
        .lean();

      if (!updatedUser) throw makeError('Người dùng không tồn tại', 404);
    });

    const u = updatedUser as unknown as { profile: { heightCm?: number; weightKg?: number } };
    return {
      bmiRecord: bmiRecord!,
      user: {
        heightCm: u.profile.heightCm!,
        weightKg: u.profile.weightKg!,
      },
    };
  } catch (err: unknown) {
    const e = err as { codeName?: string; message?: string };
    const isUnsupported =
      e?.codeName === 'IllegalOperation' ||
      /Transaction numbers are only allowed on a replica set/.test(e?.message ?? '') ||
      /transactions are not supported/.test((e?.message ?? '').toLowerCase());

    if (!isUnsupported) throw err;

    // Fallback: sequential save (used when transactions are unsupported)
    console.warn('[bmi.service] Transactions unsupported — falling back to sequential save.');

    const bmiRecord = await BMIRecord.create({
      userId: userObjId,
      heightCm,
      weightKg,
      bmi,
      category,
      recordedAt: now,
    });

    try {
      const updatedUser = await User.findByIdAndUpdate(
        userObjId,
        { 'profile.heightCm': heightCm, 'profile.weightKg': weightKg },
        { new: true, runValidators: true },
      )
        .select('profile')
        .lean();

      if (!updatedUser) {
        await BMIRecord.deleteOne({ _id: bmiRecord._id });
        throw makeError('Người dùng không tồn tại', 404);
      }

      return {
        bmiRecord: bmiRecord.toObject(),
        user: {
          heightCm: updatedUser.profile.heightCm!,
          weightKg: updatedUser.profile.weightKg!,
        },
      };
    } catch (userErr: unknown) {
      await BMIRecord.deleteOne({ _id: bmiRecord._id }).catch(() => {});
      throw userErr;
    }
  } finally {
    session.endSession();
  }
}

// ---------------------------------------------------------------------------
// getBMIHistory — last 30 UTC+7 days, 1 entry per day = LAST record of day (D-55)
// ---------------------------------------------------------------------------

export async function getBMIHistory(
  userId: string,
): Promise<Array<{ date: string; bmi: number; category: string }>> {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const thirtyDaysAgo = new Date(
    vietnamDayStart(new Date()).getTime() - 29 * 86400000,
  );

  const pipeline: PipelineStage[] = [
    { $match: { userId: userObjId, recordedAt: { $gte: thirtyDaysAgo } } },
    {
      $addFields: {
        dayBucket: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: { $add: ['$recordedAt', 7 * 60 * 60 * 1000] },
          },
        },
      },
    },
    { $sort: { recordedAt: -1 } },
    {
      $group: {
        _id: '$dayBucket',
        bmi: { $first: '$bmi' },
        category: { $first: '$category' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', bmi: 1, category: 1 } },
  ];

  return BMIRecord.aggregate(pipeline);
}
