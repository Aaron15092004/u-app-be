import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AdminV2Campaign,
  AdminV2CampaignStatus,
  AdminV2GeneratedRedeemCodeExportRow,
  AdminV2RedeemCodeMetadata,
  AdminV2RedeemCodeStatus,
} from '@/features/v2-contracts/types';

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCampaignInput {
  name: string;
  description?: string | null;
  status: AdminV2CampaignStatus;
  startsAt: string;
  endsAt: string;
  entitlementDurationDays: number;
  highQuotaDailyLimit: number;
}

export interface GenerateCampaignCodesInput {
  quantity: number;
  batchLabel?: string;
  codeLength: number;
  codeExpiresAt?: string | null;
  redeemBaseUrl?: string;
}

export interface GenerateCampaignCodesResponse {
  batchId: string;
  quantity: number;
  rows: AdminV2GeneratedRedeemCodeExportRow[];
  csv: string;
}

export function useCampaigns(page = 1, status?: AdminV2CampaignStatus | 'all') {
  return useQuery({
    queryKey: ['admin', 'campaigns', page, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status && status !== 'all') params.set('status', status);
      const { data } = await apiClient.get<{ success: true; data: ListResponse<AdminV2Campaign> }>(
        `/api/admin/campaigns?${params}`,
      );
      return data.data;
    },
  });
}

export function useCampaignCodes(
  campaignId: string | null,
  page = 1,
  status?: AdminV2RedeemCodeStatus | 'all',
) {
  return useQuery({
    queryKey: ['admin', 'campaigns', campaignId, 'codes', page, status],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (status && status !== 'all') params.set('status', status);
      const { data } = await apiClient.get<{ success: true; data: ListResponse<AdminV2RedeemCodeMetadata> }>(
        `/api/admin/campaigns/${campaignId}/codes?${params}`,
      );
      return data.data;
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const { data } = await apiClient.post<{ success: true; data: AdminV2Campaign }>(
        '/api/admin/campaigns',
        input,
      );
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });
}

export function useGenerateCampaignCodes(campaignId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GenerateCampaignCodesInput) => {
      const { data } = await apiClient.post<{ success: true; data: GenerateCampaignCodesResponse }>(
        `/api/admin/campaigns/${campaignId}/codes/generate`,
        input,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns', campaignId, 'codes'] });
    },
  });
}

export function useRevokeCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => apiClient.patch(`/api/admin/campaigns/${campaignId}/revoke`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] }),
  });
}

export function useRevokeCampaignCode(campaignId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codeId: string) => apiClient.patch(`/api/admin/campaigns/codes/${codeId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns', campaignId, 'codes'] });
    },
  });
}
