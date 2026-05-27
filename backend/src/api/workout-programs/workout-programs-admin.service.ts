import WorkoutProgram from '../../models/WorkoutProgram';
import type { IWorkoutProgram } from '../../models/WorkoutProgram';
import { uploadImage } from '../../services/cloudinary.service';

export async function adminListPrograms() {
  const programs = await WorkoutProgram.find({}).lean();
  return programs.map((p) => ({
    _id: p._id,
    title: p.title,
    titleEn: p.titleEn,
    level: p.level,
    description: p.description,
    imageUrl: p.imageUrl,
    estimatedWeeks: p.estimatedWeeks,
    totalDays: p.days.length,
    days: p.days,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

export async function adminCreateProgram(data: Partial<IWorkoutProgram>) {
  const program = await WorkoutProgram.create(data);
  return program;
}

export async function adminUpdateProgram(id: string, data: Partial<IWorkoutProgram>) {
  const program = await WorkoutProgram.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!program) {
    throw Object.assign(new Error('Không tìm thấy chương trình tập'), { statusCode: 404 });
  }
  return program;
}

export async function adminDeleteProgram(id: string): Promise<void> {
  const result = await WorkoutProgram.findByIdAndDelete(id);
  if (!result) {
    throw Object.assign(new Error('Không tìm thấy chương trình tập'), { statusCode: 404 });
  }
}

export async function adminUploadProgramImage(id: string, imageBuffer: Buffer): Promise<string> {
  const result = await uploadImage(imageBuffer, { folder: 'u-app/programs' });
  const program = await WorkoutProgram.findByIdAndUpdate(
    id,
    { imageUrl: result.url },
    { new: true },
  );
  if (!program) {
    throw Object.assign(new Error('Không tìm thấy chương trình tập'), { statusCode: 404 });
  }
  return result.url;
}
