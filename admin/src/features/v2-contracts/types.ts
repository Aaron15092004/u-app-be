export type AdminV2CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'revoked';
export type AdminV2RedeemCodeStatus = 'unused' | 'redeemed' | 'revoked' | 'expired';
export type AdminV2RedeemSource = 'manual' | 'qr';
export type AdminV2QuotaPolicyMode = 'high_daily_quota';
export type AdminV2EntitlementType = 'ai_scan_high_quota';
export type AdminV2EntitlementSource = 'redeem_code';

export interface AdminV2Campaign {
  _id: string;
  name: string;
  description?: string;
  status: AdminV2CampaignStatus;
  startsAt: string;
  endsAt: string;
  entitlementDurationDays: number;
  highQuotaDailyLimit: number;
  createdBy?: string;
  codeCount: number;
  redeemedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminV2CampaignOpsStats {
  campaignCount: number;
  totalCodes: number;
  redeemedCodes: number;
  redeemedRate: number;
  activeCampaigns: number;
  nearExpiryCampaigns: Array<{
    _id: string;
    name: string;
    endsAt: string;
    codeCount: number;
    redeemedCount: number;
  }>;
}

export interface AdminV2RedeemCodeMetadata {
  _id: string;
  campaignId: string;
  batchId: string;
  codeHash: string;
  codePrefix: string;
  codeLength: number;
  status: AdminV2RedeemCodeStatus;
  expiresAt: string | null;
  redeemedBy?: string;
  redeemedAt?: string;
  redemptionSource?: AdminV2RedeemSource;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminV2GeneratedRedeemCodeExportRow {
  rawCode: string;
  redeemUrl: string;
  codePrefix: string;
  campaignId: string;
  campaignName: string;
  batchId: string;
  expiresAt: string | null;
  entitlementDurationDays: number;
}

export interface AdminV2ScanQuotaPolicy {
  mode: AdminV2QuotaPolicyMode;
  dailyLimit: number;
}

export interface AdminV2UserScanEntitlement {
  _id: string;
  userId: string;
  campaignId: string;
  redeemCodeId: string;
  type: AdminV2EntitlementType;
  startsAt: string;
  activeUntil: string;
  quotaPolicy: AdminV2ScanQuotaPolicy;
  source: AdminV2EntitlementSource;
  createdAt: string;
  updatedAt: string;
}

export type AdminV2MediaAssetStatus = 'uploaded' | 'assigned' | 'failed' | 'archived';
export type AdminV2MediaAssetSource = 'admin_upload' | 'bulk_import' | 'external_url';

export interface AdminV2MediaAsset {
  _id: string;
  source: AdminV2MediaAssetSource;
  status: AdminV2MediaAssetStatus;
  batchId?: string;
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  bytes?: number;
  mimeType?: string;
  assignedExerciseId?: string;
  uploadedBy?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type AdminV2RatingTrigger =
  | 'food_scan_saved'
  | 'workout_completed'
  | 'habit_streak'
  | 'profile_prompt'
  | 'manual';
export type AdminV2RatingPlatform = 'ios' | 'android' | 'web' | 'unknown';
export type AdminV2PromptStatus = 'eligible' | 'dismissed' | 'submitted' | 'cooldown';

export interface AdminV2AppRating {
  _id: string;
  userId: string | { _id: string; email?: string; name?: string };
  stars: number;
  comment?: string;
  trigger: AdminV2RatingTrigger;
  appVersion?: string;
  platform: AdminV2RatingPlatform;
  deviceInfo?: Record<string, unknown>;
  storeReviewRequested?: boolean;
  storeReviewEligible?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminV2RatingsDashboard {
  total: number;
  averageStars: number;
  distribution: Array<{ stars: number; count: number }>;
  recentComments: AdminV2AppRating[];
}

export interface AdminV2FeedbackPromptState {
  _id: string;
  userId: string;
  promptKey: 'app_rating';
  status: AdminV2PromptStatus;
  lastPromptedAt?: string;
  dismissedAt?: string;
  submittedAt?: string;
  cooldownUntil?: string;
  triggerCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export type AdminV2BarcodeSource = 'manual' | 'open_food_facts' | 'admin_import';

export interface AdminV2BarcodeProductMetadata {
  barcode: string;
  barcodes?: string[];
  productId?: string;
  name: string;
  brand?: string;
  servingSizeG?: number;
  packageSize?: string;
  barcodeSource: AdminV2BarcodeSource;
  barcodeLastVerifiedAt?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isSaveReady: boolean;
  missingFields?: Array<'name' | 'calories' | 'protein' | 'carbs' | 'fat'>;
}

export type AdminV2NutMilkBmiRule = 'lt_18_5' | 'range_18_5_22_9' | 'gt_23' | 'any';
export type AdminV2NutMilkResolvedBmiRule = AdminV2NutMilkBmiRule | 'boundary_23';
export type AdminV2NutMilkNeedSignal = 'stress_sleep' | 'energy_memory';
export type AdminV2NutMilkPreferenceSource = 'bmi_recommendation' | 'manual_profile';

export interface AdminV2NutMilkFlavorRule {
  flavorId: string;
  nameVi: string;
  bmiRule: AdminV2NutMilkBmiRule;
  needSignal?: AdminV2NutMilkNeedSignal;
  positioningVi: string;
}

export interface AdminV2NutMilkPreference {
  _id: string;
  userId: string;
  recommendedFlavorId?: string;
  selectedFlavorId: string;
  bmiRecordId?: string;
  bmi?: number;
  bmiCategory?: AdminV2NutMilkResolvedBmiRule | 'underweight' | 'normal' | 'overweight' | 'obese';
  signals?: {
    stressOrSleep?: boolean;
    energyOrMemory?: boolean;
  };
  source: AdminV2NutMilkPreferenceSource;
  createdAt: string;
  updatedAt: string;
}
