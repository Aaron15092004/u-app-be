import Exercise, { IExercise } from '../../models/Exercise';
import FoodItem, { IFoodItem } from '../../models/FoodItem';
import User from '../../models/User';
import BMIRecord from '../../models/BMIRecord';
import FoodLog from '../../models/FoodLog';
import WorkoutLog from '../../models/WorkoutLog';
import { uploadImage } from '../../services/cloudinary.service';

// ---- Dashboard Stats ----

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalExercises: number;
  totalFoodItems: number;
  totalWorkouts: number;
  newUsersLast7Days: Array<{ date: string; count: number }>;
  bmiDistribution: Array<{ category: string; count: number }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [
    totalUsers,
    activeUsers,
    totalExercises,
    totalFoodItems,
    totalWorkouts,
    newUsersCounts,
    bmiDist,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Exercise.countDocuments(),
    FoodItem.countDocuments(),
    WorkoutLog.countDocuments(),
    Promise.all(
      days.map(async (d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const count = await User.countDocuments({ createdAt: { $gte: d, $lt: next } });
        return {
          date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          count,
        };
      }),
    ),
    BMIRecord.aggregate([
      { $sort: { userId: 1, recordedAt: -1 } },
      { $group: { _id: '$userId', category: { $first: '$category' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const categoryLabels: Record<string, string> = {
    underweight: 'Thiếu cân',
    normal: 'Bình thường',
    overweight: 'Thừa cân',
    obese: 'Béo phì',
  };

  return {
    totalUsers,
    activeUsers,
    bannedUsers: totalUsers - activeUsers,
    totalExercises,
    totalFoodItems,
    totalWorkouts,
    newUsersLast7Days: newUsersCounts,
    bmiDistribution: bmiDist.map((d: { _id: string; count: number }) => ({
      category: categoryLabels[d._id] ?? d._id,
      count: d.count,
    })),
  };
}

// ---- Upload ----

export async function uploadAdminImage(
  buffer: Buffer,
  folder: 'exercises' | 'food-items',
): Promise<{ url: string; publicId: string }> {
  const result = await uploadImage(buffer, { folder: `u-app/${folder}` });
  return { url: result.url, publicId: result.publicId };
}

// ---- Exercises ----

export async function listExercises(
  page: number,
  limit: number,
  search?: string,
): Promise<{ items: IExercise[]; total: number; page: number; totalPages: number }> {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Exercise.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Exercise.countDocuments(filter),
  ]);

  return { items: items as unknown as IExercise[], total, page, totalPages: Math.ceil(total / limit) };
}

export async function createExercise(data: Partial<IExercise>): Promise<IExercise> {
  const exercise = await Exercise.create(data);
  return exercise;
}

export async function updateExercise(id: string, data: Partial<IExercise>): Promise<IExercise> {
  const exercise = await Exercise.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!exercise) throw Object.assign(new Error('Không tìm thấy bài tập'), { statusCode: 404 });
  return exercise;
}

export async function deleteExercise(id: string): Promise<void> {
  const result = await Exercise.findByIdAndDelete(id);
  if (!result) throw Object.assign(new Error('Không tìm thấy bài tập'), { statusCode: 404 });
}

// ---- Food Items ----

export async function listFoodItems(
  page: number,
  limit: number,
  search?: string,
): Promise<{ items: IFoodItem[]; total: number; page: number; totalPages: number }> {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    FoodItem.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    FoodItem.countDocuments(filter),
  ]);

  return { items: items as unknown as IFoodItem[], total, page, totalPages: Math.ceil(total / limit) };
}

export async function createFoodItem(data: Partial<IFoodItem>): Promise<IFoodItem> {
  const item = await FoodItem.create({ ...data, source: 'manual' });
  return item;
}

export async function updateFoodItem(id: string, data: Partial<IFoodItem>): Promise<IFoodItem> {
  const item = await FoodItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!item) throw Object.assign(new Error('Không tìm thấy món ăn'), { statusCode: 404 });
  return item;
}

export async function deleteFoodItem(id: string): Promise<void> {
  const result = await FoodItem.findByIdAndDelete(id);
  if (!result) throw Object.assign(new Error('Không tìm thấy món ăn'), { statusCode: 404 });
}

// ---- Users ----

export async function listUsers(
  page: number,
  limit: number,
  search?: string,
): Promise<{ items: object[]; total: number; page: number; totalPages: number }> {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.email = { $regex: search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('email name role isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function banUser(targetId: string, requesterId: string): Promise<object> {
  if (targetId === requesterId) {
    throw Object.assign(new Error('Không thể tự khóa tài khoản của mình'), { statusCode: 403 });
  }

  const target = await User.findById(targetId).select('role isActive');
  if (!target) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  if (target.role === 'admin') {
    throw Object.assign(new Error('Không thể khóa tài khoản quản trị viên'), { statusCode: 403 });
  }

  const updated = await User.findByIdAndUpdate(
    targetId,
    { isActive: !target.isActive },
    { new: true },
  ).select('email name role isActive createdAt');

  return updated!;
}

export async function deleteUser(targetId: string, requesterId: string): Promise<void> {
  if (targetId === requesterId) {
    throw Object.assign(new Error('Không thể xóa tài khoản của mình'), { statusCode: 403 });
  }

  const target = await User.findById(targetId).select('role');
  if (!target) throw Object.assign(new Error('Không tìm thấy người dùng'), { statusCode: 404 });
  if (target.role === 'admin') {
    throw Object.assign(new Error('Không thể xóa tài khoản quản trị viên'), { statusCode: 403 });
  }

  await User.findByIdAndDelete(targetId);
}
