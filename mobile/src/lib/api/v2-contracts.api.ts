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
  IV2RatingTrigger,
} from './types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const NUT_MILK_COPY: Record<string, { nameVi: string; positioningVi: string }> = {
  rau_ma_sua_dua: {
    nameVi: 'Rau má sữa dừa',
    positioningVi: 'Thanh nhiệt và kiểm soát cân nặng',
  },
  rau_ma_hat_sen: {
    nameVi: 'Rau má - Hạt sen',
    positioningVi: 'Giảm stress và ngủ ngon sâu giấc',
  },
  gao_lut_me_den_hat_sen: {
    nameVi: 'Gạo lứt - Mè đen - Hạt sen',
    positioningVi: 'Duy trì vóc dáng và đẹp da, chống lão hóa',
  },
  gao_lut_oc_cho_hanh_nhan: {
    nameVi: 'Gạo lứt - Óc chó - Hạnh nhân',
    positioningVi: 'Bổ sung dinh dưỡng và tăng cường trí não',
  },
  hat_sen_oc_cho: {
    nameVi: 'Hạt sen - Óc chó',
    positioningVi: 'Phục hồi năng lượng và trí nhớ bền bỉ',
  },
};

function normalizeNutMilkCopy(
  data: IV2NutMilkRecommendationResponse,
): IV2NutMilkRecommendationResponse {
  return {
    ...data,
    disclaimer:
      data.disclaimer.includes('Goi y')
        ? 'Gợi ý sữa hạt là gợi ý sản phẩm theo sở thích và chỉ số cơ thể, không phải chẩn đoán hay điều trị y khoa.'
        : data.disclaimer,
    flavors: data.flavors.map((flavor) => ({
      ...flavor,
      ...(NUT_MILK_COPY[flavor.flavorId] ?? {}),
    })),
  };
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
  return normalizeNutMilkCopy(res.data.data);
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

export async function dismissRatingPromptApi(trigger: IV2RatingTrigger = 'manual'): Promise<IV2FeedbackPromptStatus> {
  const res = await apiClient.post<ApiResponse<IV2FeedbackPromptStatus>>('/api/ratings/dismiss', { trigger });
  return res.data.data;
}
