import Exercise from '../../models/Exercise';

function makeError(message: string, statusCode: number): Error {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listExercises(category?: string) {
  const filter: Record<string, unknown> = { isActive: true };
  if (category) {
    filter.category = category;
  }
  return Exercise.find(filter).sort({ createdAt: 1 }).lean();
}

export async function getExerciseById(id: string) {
  const exercise = await Exercise.findById(id).lean();
  if (!exercise) {
    throw makeError('Bài tập không tồn tại', 404);
  }
  return exercise;
}
