import { z } from 'zod';

export const saveBMISchema = z.object({
  heightCm: z
    .number()
    .min(100, 'Chiều cao phải từ 100 đến 220 cm')
    .max(220, 'Chiều cao phải từ 100 đến 220 cm'),
  weightKg: z
    .number()
    .min(30, 'Cân nặng phải từ 30 đến 200 kg')
    .max(200, 'Cân nặng phải từ 30 đến 200 kg'),
}).strict();
