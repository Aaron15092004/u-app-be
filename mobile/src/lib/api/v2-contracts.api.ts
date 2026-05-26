import apiClient from './client';
import type {
  IV2BarcodeLookupResult,
  IV2FeedbackPromptStatus,
  IV2NutMilkRecommendationResponse,
  IV2RedeemCampaignCodeRequest,
  IV2RedeemCampaignCodeResponse,
  IV2ScanEntitlementStatus,
  IV2SelectNutMilkFlavorRequest,
  IV2SubmitAppRatingRequest,
  IV2AppRating,
  IV2NutMilkPreference,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function redeemCampaignCodeApi(
  body: IV2RedeemCampaignCodeRequest,
): Promise<IV2RedeemCampaignCodeResponse> {
  const res = await apiClient.post<ApiResponse<IV2RedeemCampaignCodeResponse>>(
    '/api/campaigns/redeem',
    body,
  );
  return res.data.data;
}

export async function getScanEntitlementsApi(): Promise<IV2ScanEntitlementStatus> {
  const res = await apiClient.get<ApiResponse<IV2ScanEntitlementStatus>>(
    '/api/campaigns/me/entitlements',
  );
  return res.data.data;
}

export async function getFoodItemByBarcodeApi(barcode: string): Promise<IV2BarcodeLookupResult> {
  const res = await apiClient.get<ApiResponse<IV2BarcodeLookupResult>>(
    `/api/food/items/barcode/${encodeURIComponent(barcode)}`,
  );
  return res.data.data;
}

export async function getNutMilkRecommendationsApi(params?: {
  bmi?: number;
  stressOrSleep?: boolean;
  energyOrMemory?: boolean;
}): Promise<IV2NutMilkRecommendationResponse> {
  const res = await apiClient.get<ApiResponse<IV2NutMilkRecommendationResponse>>(
    '/api/recommendations/nut-milk',
    { params },
  );
  return res.data.data;
}

export async function selectNutMilkFlavorApi(
  body: IV2SelectNutMilkFlavorRequest,
): Promise<IV2NutMilkPreference> {
  const res = await apiClient.post<ApiResponse<IV2NutMilkPreference>>(
    '/api/recommendations/nut-milk/selection',
    body,
  );
  return res.data.data;
}

export async function getRatingPromptStatusApi(): Promise<IV2FeedbackPromptStatus> {
  const res = await apiClient.get<ApiResponse<IV2FeedbackPromptStatus>>('/api/ratings/status');
  return res.data.data;
}

export async function submitAppRatingApi(
  body: IV2SubmitAppRatingRequest,
): Promise<IV2AppRating> {
  const res = await apiClient.post<ApiResponse<IV2AppRating>>('/api/ratings', body);
  return res.data.data;
}
