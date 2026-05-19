// userId always sourced from JWT (req.user.id), never body — IDOR protection.
import { z } from 'zod';

export const logWaterSchema = z
  .object({
    loggedAt: z.string().datetime().optional(),
  })
  .strict();
