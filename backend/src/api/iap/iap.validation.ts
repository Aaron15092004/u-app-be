import { z } from 'zod';

export const verifyAppleScanPassSchema = z.object({
  productId: z.string().min(1),
  transactionId: z.string().min(1),
  purchaseToken: z.string().min(1).optional().nullable(),
  transactionDate: z.number().optional().nullable(),
  environment: z.string().optional().nullable(),
});

export type VerifyAppleScanPassInput = z.infer<typeof verifyAppleScanPassSchema>;
