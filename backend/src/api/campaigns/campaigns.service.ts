import { randomBytes, randomUUID } from 'node:crypto';
import { stringify } from 'csv-stringify/sync';
import mongoose from 'mongoose';
import Campaign, { CampaignStatus } from '../../models/Campaign';
import RedeemCode, { RedeemCodeStatus } from '../../models/RedeemCode';
import UserScanEntitlement from '../../models/UserScanEntitlement';
import {
  HIGH_QUOTA_DAILY_LIMIT,
  SCAN_QUOTA_POLICY_MODE,
  buildRedeemHttpsUrl,
  hashRedeemCode,
  normalizeRedeemCode,
} from '../../services/redeem-code.service';
import {
  CreateCampaignInput,
  GenerateCampaignCodesInput,
  RedeemCampaignCodeInput,
} from './campaigns.validation';

const DEFAULT_REDEEM_BASE_URL = 'https://u-app.vn/redeem';
const REDEEM_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const REDEEM_ATTEMPT_LIMIT = 8;

type RedeemErrorCode =
  | 'INVALID_CODE'
  | 'ALREADY_USED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'INACTIVE_CAMPAIGN'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR';

interface RedeemAttemptBucket {
  count: number;
  resetAt: number;
}

const redeemAttemptBuckets = new Map<string, RedeemAttemptBucket>();

function makeError(
  message: string,
  statusCode: number,
  code: RedeemErrorCode = 'SERVER_ERROR',
): Error & { statusCode: number; errorCode: RedeemErrorCode } {
  const err = new Error(message) as Error & { statusCode: number; errorCode: RedeemErrorCode };
  err.statusCode = statusCode;
  err.errorCode = code;
  return err;
}

function redeemAttemptKey(userId: string, ip?: string): string {
  return `${userId}:${ip ?? 'unknown'}`;
}

export function clearRedeemAttemptLimitForTests(): void {
  redeemAttemptBuckets.clear();
}

function assertRedeemAttemptAllowed(userId: string, ip?: string): void {
  const now = Date.now();
  const key = redeemAttemptKey(userId, ip);
  const bucket = redeemAttemptBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    redeemAttemptBuckets.set(key, { count: 1, resetAt: now + REDEEM_ATTEMPT_WINDOW_MS });
    return;
  }

  bucket.count += 1;
  if (bucket.count > REDEEM_ATTEMPT_LIMIT) {
    throw makeError(
      'Ban thu kich hoat qua nhieu lan. Vui long doi it phut roi thu lai.',
      429,
      'RATE_LIMITED',
    );
  }
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function generateRawCode(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  let out = '';
  for (const byte of bytes) {
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

function buildQrImageUrl(value: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}`;
}

function buildExcelQrFormula(qrImageUrl: string): string {
  return `=IMAGE("${qrImageUrl}")`;
}

function toIso(value?: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export interface CampaignListFilters {
  status?: CampaignStatus;
  page: number;
  limit: number;
}

export interface CodeListFilters {
  status?: RedeemCodeStatus;
  page: number;
  limit: number;
}

export async function createCampaign(input: CreateCampaignInput, adminId: string): Promise<object> {
  const doc = await Campaign.create({
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    entitlementDurationDays: input.entitlementDurationDays,
    highQuotaDailyLimit: input.highQuotaDailyLimit ?? HIGH_QUOTA_DAILY_LIMIT,
    createdBy: new mongoose.Types.ObjectId(adminId),
  });

  return doc.toObject();
}

export async function listCampaigns(filters: CampaignListFilters): Promise<object> {
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;

  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
    Campaign.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit) || 1,
  };
}

export async function getCampaignOpsStats(): Promise<object> {
  const now = new Date();
  const nearExpiryUntil = new Date(now.getTime() + 14 * 86400000);

  const [
    totalCodes,
    redeemedCodes,
    activeCampaigns,
    nearExpiryCampaigns,
    campaignCount,
  ] = await Promise.all([
    RedeemCode.countDocuments({}),
    RedeemCode.countDocuments({ status: 'redeemed' }),
    Campaign.countDocuments({
      status: 'active',
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    }),
    Campaign.find({
      status: 'active',
      endsAt: { $gte: now, $lte: nearExpiryUntil },
    })
      .sort({ endsAt: 1 })
      .limit(5)
      .select('name endsAt codeCount redeemedCount')
      .lean(),
    Campaign.countDocuments({}),
  ]);

  return {
    campaignCount,
    totalCodes,
    redeemedCodes,
    redeemedRate: totalCodes > 0 ? redeemedCodes / totalCodes : 0,
    activeCampaigns,
    nearExpiryCampaigns,
  };
}

export async function listCampaignCodes(
  campaignId: string,
  filters: CodeListFilters,
): Promise<object> {
  const query: Record<string, unknown> = { campaignId: new mongoose.Types.ObjectId(campaignId) };
  if (filters.status) query.status = filters.status;

  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    RedeemCode.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .select('-codeHash')
      .lean(),
    RedeemCode.countDocuments(query),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit) || 1,
  };
}

export async function generateCampaignCodes(
  campaignId: string,
  input: GenerateCampaignCodesInput,
  adminId: string,
): Promise<object> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw makeError('Khong tim thay campaign', 404);
  }
  if (campaign.status === 'revoked' || campaign.status === 'ended') {
    throw makeError('Campaign khong con cho phep tao ma', 409);
  }

  const batchId = input.batchLabel ?? randomUUID();
  const redeemBaseUrl = input.redeemBaseUrl ?? process.env.REDEEM_BASE_URL ?? DEFAULT_REDEEM_BASE_URL;
  const codeExpiresAt = input.codeExpiresAt === null
    ? null
    : input.codeExpiresAt
      ? new Date(input.codeExpiresAt)
      : campaign.endsAt;

  const rows: Array<{
    rawCode: string;
    qrText: string;
    qrImageUrl: string;
    qrExcelFormula: string;
    redeemUrl: string;
    codePrefix: string;
    campaignId: string;
    campaignName: string;
    batchId: string;
    expiresAt: string | null;
    entitlementDurationDays: number;
  }> = [];
  const docs: Array<{
    campaignId: mongoose.Types.ObjectId;
    batchId: string;
    codeHash: string;
    codePrefix: string;
    codeLength: number;
    status: 'unused';
    expiresAt: Date | null;
    createdBy: mongoose.Types.ObjectId;
  }> = [];
  const generated = new Map<string, { rawCode: string; codeHash: string }>();

  for (let attempt = 0; generated.size < input.quantity && attempt < 10; attempt += 1) {
    const candidateCount = Math.max(input.quantity - generated.size, 1);
    const candidates = new Map<string, string>();

    while (candidates.size < candidateCount) {
      const rawCode = generateRawCode(input.codeLength);
      candidates.set(hashRedeemCode(rawCode), rawCode);
    }

    const existing = await RedeemCode.find({
      codeHash: { $in: Array.from(candidates.keys()) },
    }).select('codeHash').lean();
    const existingHashes = new Set(existing.map((doc) => String(doc.codeHash)));

    for (const [codeHash, rawCode] of candidates) {
      if (!existingHashes.has(codeHash) && !generated.has(codeHash)) {
        generated.set(codeHash, { rawCode, codeHash });
      }
      if (generated.size >= input.quantity) break;
    }
  }

  if (generated.size < input.quantity) {
    throw makeError('Khong the tao du so ma duy nhat, vui long thu lai voi do dai ma lon hon', 500);
  }

  for (const { rawCode, codeHash } of generated.values()) {
    const normalizedCode = normalizeRedeemCode(rawCode);
    const redeemUrl = buildRedeemHttpsUrl(redeemBaseUrl, rawCode);
    const qrImageUrl = buildQrImageUrl(rawCode);

    docs.push({
      campaignId: campaign._id as mongoose.Types.ObjectId,
      batchId,
      codeHash,
      codePrefix: normalizedCode.slice(0, 4),
      codeLength: normalizedCode.length,
      status: 'unused',
      expiresAt: codeExpiresAt,
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    rows.push({
      rawCode,
      qrText: rawCode,
      qrImageUrl,
      qrExcelFormula: buildExcelQrFormula(qrImageUrl),
      redeemUrl,
      codePrefix: normalizedCode.slice(0, 4),
      campaignId: String(campaign._id),
      campaignName: campaign.name,
      batchId,
      expiresAt: toIso(codeExpiresAt),
      entitlementDurationDays: campaign.entitlementDurationDays,
    });
  }

  await RedeemCode.insertMany(docs, { ordered: true });
  await Campaign.findByIdAndUpdate(campaign._id, { $inc: { codeCount: docs.length } });

  const csv = stringify(rows, {
    header: true,
    columns: [
      { key: 'rawCode', header: 'Ma kich hoat' },
      { key: 'qrText', header: 'Noi dung QR' },
      { key: 'qrImageUrl', header: 'Link anh QR' },
      { key: 'qrExcelFormula', header: 'Cong thuc QR trong Excel' },
      { key: 'redeemUrl', header: 'Link redeem HTTPS' },
      { key: 'codePrefix', header: 'Prefix hien thi trong admin' },
      { key: 'campaignId', header: 'Campaign ID' },
      { key: 'campaignName', header: 'Campaign' },
      { key: 'batchId', header: 'Batch' },
      { key: 'expiresAt', header: 'Het han ma' },
      { key: 'entitlementDurationDays', header: 'So ngay kich hoat' },
    ],
  });

  return {
    batchId,
    quantity: rows.length,
    rows,
    csv,
  };
}

export async function revokeCampaign(campaignId: string): Promise<object> {
  const campaign = await Campaign.findByIdAndUpdate(
    campaignId,
    { $set: { status: 'revoked' } },
    { new: true },
  ).lean();
  if (!campaign) {
    throw makeError('Khong tim thay campaign', 404);
  }
  await RedeemCode.updateMany(
    { campaignId: new mongoose.Types.ObjectId(campaignId), status: 'unused' },
    { $set: { status: 'revoked' } },
  );
  return campaign;
}

export async function revokeCode(codeId: string): Promise<object> {
  const code = await RedeemCode.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(codeId), status: 'unused' },
    { $set: { status: 'revoked' } },
    { new: true },
  ).select('-codeHash').lean();
  if (!code) {
    throw makeError('Khong tim thay ma co the thu hoi', 404);
  }
  return code;
}

export async function redeemCampaignCode(
  userId: string,
  input: RedeemCampaignCodeInput,
  context?: { ip?: string },
): Promise<object> {
  assertRedeemAttemptAllowed(userId, context?.ip);

  const now = new Date();
  const codeHash = hashRedeemCode(input.code);
  const code = await RedeemCode.findOne({ codeHash });

  if (!code) {
    throw makeError('Ma kich hoat khong hop le', 404, 'INVALID_CODE');
  }
  if (code.status === 'redeemed') {
    throw makeError('Ma kich hoat da duoc su dung', 409, 'ALREADY_USED');
  }
  if (code.status === 'revoked') {
    throw makeError('Ma kich hoat da bi thu hoi', 410, 'REVOKED');
  }
  if (code.expiresAt && code.expiresAt.getTime() < now.getTime()) {
    await RedeemCode.updateOne(
      { _id: code._id, status: 'unused' },
      { $set: { status: 'expired' } },
    );
    throw makeError('Ma kich hoat da het han', 410, 'EXPIRED');
  }

  const campaign = await Campaign.findById(code.campaignId);
  if (!campaign || campaign.status !== 'active') {
    throw makeError('Campaign hien khong hoat dong', 409, 'INACTIVE_CAMPAIGN');
  }
  if (campaign.startsAt.getTime() > now.getTime() || campaign.endsAt.getTime() < now.getTime()) {
    throw makeError('Campaign khong nam trong thoi gian kich hoat', 409, 'INACTIVE_CAMPAIGN');
  }

  const updatedCode = await RedeemCode.findOneAndUpdate(
    { _id: code._id, status: 'unused' },
    {
      $set: {
        status: 'redeemed',
        redeemedBy: new mongoose.Types.ObjectId(userId),
        redeemedAt: now,
        redemptionSource: input.source,
      },
    },
    { new: true },
  );

  if (!updatedCode) {
    throw makeError('Ma kich hoat da duoc su dung', 409, 'ALREADY_USED');
  }

  const activeUntil = addDays(now, campaign.entitlementDurationDays);

  try {
    const entitlement = await UserScanEntitlement.create({
      userId: new mongoose.Types.ObjectId(userId),
      campaignId: campaign._id,
      redeemCodeId: updatedCode._id,
      startsAt: now,
      activeUntil,
      quotaPolicy: {
        mode: SCAN_QUOTA_POLICY_MODE,
        dailyLimit: HIGH_QUOTA_DAILY_LIMIT,
      },
      source: 'redeem_code',
    });
    await Campaign.findByIdAndUpdate(campaign._id, { $inc: { redeemedCount: 1 } });

    return {
      status: 'success',
      message: 'Kich hoat goi quet AI thanh cong',
      entitlement: entitlement.toObject(),
    };
  } catch (err) {
    await RedeemCode.updateOne(
      { _id: updatedCode._id, status: 'redeemed', redeemedBy: new mongoose.Types.ObjectId(userId) },
      {
        $set: { status: 'unused' },
        $unset: { redeemedBy: '', redeemedAt: '', redemptionSource: '' },
      },
    );
    throw err;
  }
}

export async function getActiveScanEntitlement(userId: string): Promise<object | null> {
  const now = new Date();
  return UserScanEntitlement.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    activeUntil: { $gt: now },
  })
    .sort({ activeUntil: -1 })
    .lean();
}

export async function getMyScanEntitlements(userId: string): Promise<object> {
  const entitlement = await getActiveScanEntitlement(userId) as {
    _id: mongoose.Types.ObjectId;
    campaignId?: mongoose.Types.ObjectId;
    redeemCodeId?: mongoose.Types.ObjectId;
    activeUntil: Date;
    quotaPolicy: { mode: string; dailyLimit: number };
  } | null;

  if (!entitlement) {
    return {
      hasActiveEntitlement: false,
      activeUntil: null,
      campaignId: null,
      redeemCodeId: null,
      quotaPolicy: null,
      entitlement: null,
      message: 'Ban chua co goi quet AI dang hoat dong',
    };
  }

  return {
    hasActiveEntitlement: true,
    activeUntil: entitlement.activeUntil.toISOString(),
    campaignId: entitlement.campaignId ? String(entitlement.campaignId) : null,
    redeemCodeId: entitlement.redeemCodeId ? String(entitlement.redeemCodeId) : null,
    quotaPolicy: entitlement.quotaPolicy,
    entitlement,
    message: 'Goi quet AI dang hoat dong',
  };
}
