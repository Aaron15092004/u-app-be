import mongoose from 'mongoose';
import IapPurchase from '../../models/IapPurchase';
import UserScanEntitlement from '../../models/UserScanEntitlement';
import {
  HIGH_QUOTA_DAILY_LIMIT,
  SCAN_QUOTA_POLICY_MODE,
} from '../../services/redeem-code.service';
import type { VerifyAppleScanPassInput } from './iap.validation';

export const IOS_SCAN_PASS_PRODUCT_ID =
  process.env.IOS_SCAN_PASS_PRODUCT_ID ?? 'com.uapp.health.ai_scan_pass_30d';

const IOS_SCAN_PASS_DURATION_DAYS = Number(process.env.IOS_SCAN_PASS_DURATION_DAYS ?? 30);

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

export async function grantAppleScanPass(
  userId: string,
  input: VerifyAppleScanPassInput,
): Promise<object> {
  if (input.productId !== IOS_SCAN_PASS_PRODUCT_ID) {
    throw makeError('San pham IAP khong hop le', 400);
  }

  const now = new Date();
  const userObjId = new mongoose.Types.ObjectId(userId);
  const existingPurchase = await IapPurchase.findOne({
    provider: 'apple',
    transactionId: input.transactionId,
  }).lean();

  if (existingPurchase) {
    const entitlement = existingPurchase.entitlementId
      ? await UserScanEntitlement.findById(existingPurchase.entitlementId).lean()
      : await UserScanEntitlement.findOne({
          userId: userObjId,
          source: 'ios_iap',
          activeUntil: { $gt: now },
        }).sort({ activeUntil: -1 }).lean();

    return {
      status: 'success',
      message: 'Giao dich IAP da duoc ghi nhan truoc do',
      entitlement,
    };
  }

  const activeUntil = addDays(now, IOS_SCAN_PASS_DURATION_DAYS);
  const entitlement = await UserScanEntitlement.create({
    userId: userObjId,
    startsAt: now,
    activeUntil,
    quotaPolicy: {
      mode: SCAN_QUOTA_POLICY_MODE,
      dailyLimit: HIGH_QUOTA_DAILY_LIMIT,
    },
    source: 'ios_iap',
  });

  await IapPurchase.create({
    userId: userObjId,
    provider: 'apple',
    productId: input.productId,
    transactionId: input.transactionId,
    purchaseToken: input.purchaseToken ?? null,
    rawPayload: input,
    entitlementId: entitlement._id,
  });

  return {
    status: 'success',
    message: 'Kich hoat goi scan AI bang Apple IAP thanh cong',
    entitlement: entitlement.toObject(),
  };
}
