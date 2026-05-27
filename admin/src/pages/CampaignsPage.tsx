import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Download, PackagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CreateCampaignInput,
  GenerateCampaignCodesInput,
  useCampaignCodes,
  useCampaignOpsStats,
  useCampaigns,
  useCreateCampaign,
  useGenerateCampaignCodes,
  useRevokeCampaign,
  useRevokeCampaignCode,
} from '@/features/campaigns/useCampaigns';
import type {
  AdminV2Campaign,
  AdminV2CampaignStatus,
  AdminV2RedeemCodeMetadata,
  AdminV2RedeemCodeStatus,
} from '@/features/v2-contracts/types';

const STATUS_LABEL: Record<AdminV2CampaignStatus | AdminV2RedeemCodeStatus, string> = {
  draft: 'Nháp',
  active: 'Đang chạy',
  paused: 'Tạm dừng',
  ended: 'Kết thúc',
  revoked: 'Đã thu hồi',
  unused: 'Chưa dùng',
  redeemed: 'Đã dùng',
  expired: 'Hết hạn',
};

function toDatetimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoFromLocal(value: string) {
  return new Date(value).toISOString();
}

function downloadCsv(csv: string, fileName: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const now = new Date();
const defaultCampaign: CreateCampaignInput = {
  name: '',
  description: '',
  status: 'active',
  startsAt: toDatetimeLocal(now),
  endsAt: toDatetimeLocal(new Date(now.getTime() + 90 * 86400000)),
  entitlementDurationDays: 30,
  highQuotaDailyLimit: 30,
};

const defaultGenerate: GenerateCampaignCodesInput = {
  quantity: 100,
  batchLabel: '',
  codeLength: 12,
  codeExpiresAt: '',
  redeemBaseUrl: 'https://u-app.vn/redeem',
};

export function CampaignsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AdminV2CampaignStatus | 'all'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<AdminV2Campaign | null>(null);
  const [codePage, setCodePage] = useState(1);
  const [codeStatus, setCodeStatus] = useState<AdminV2RedeemCodeStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CreateCampaignInput>(defaultCampaign);
  const [generateForm, setGenerateForm] = useState<GenerateCampaignCodesInput>(defaultGenerate);

  const { data, isPending } = useCampaigns(page, status);
  const { data: opsStats, isPending: opsPending } = useCampaignOpsStats();
  const { data: codes, isPending: codesPending } = useCampaignCodes(
    selectedCampaign?._id ?? null,
    codePage,
    codeStatus,
  );
  const createMutation = useCreateCampaign();
  const generateMutation = useGenerateCampaignCodes(selectedCampaign?._id ?? null);
  const revokeCampaignMutation = useRevokeCampaign();
  const revokeCodeMutation = useRevokeCampaignCode(selectedCampaign?._id ?? null);

  const selectedName = selectedCampaign?.name ?? 'Chưa chọn campaign';

  async function handleCreateCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...campaignForm,
        description: campaignForm.description || null,
        startsAt: toIsoFromLocal(campaignForm.startsAt),
        endsAt: toIsoFromLocal(campaignForm.endsAt),
      });
      setCreateOpen(false);
      setCampaignForm(defaultCampaign);
      toast('Đã tạo campaign');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? 'Không thể tạo campaign');
    }
  }

  async function handleGenerateCodes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCampaign) return;
    try {
      const result = await generateMutation.mutateAsync({
        ...generateForm,
        batchLabel: generateForm.batchLabel || undefined,
        codeExpiresAt: generateForm.codeExpiresAt ? toIsoFromLocal(generateForm.codeExpiresAt) : undefined,
        redeemBaseUrl: generateForm.redeemBaseUrl || undefined,
      });
      downloadCsv(result.csv, `${selectedCampaign.name}-${result.batchId}.csv`);
      setGenerateOpen(false);
      toast(`Đã tạo ${result.quantity} mã và tải CSV`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? 'Không thể tạo mã');
    }
  }

  async function handleRevokeCampaign(campaign: AdminV2Campaign) {
    if (!confirm(`Thu hồi campaign "${campaign.name}" và các mã chưa dùng?`)) return;
    try {
      await revokeCampaignMutation.mutateAsync(campaign._id);
      toast('Đã thu hồi campaign');
    } catch {
      toast.error('Không thể thu hồi campaign');
    }
  }

  async function handleRevokeCode(code: AdminV2RedeemCodeMetadata) {
    if (!confirm(`Thu hồi mã prefix ${code.codePrefix}?`)) return;
    try {
      await revokeCodeMutation.mutateAsync(code._id);
      toast('Đã thu hồi mã');
    } catch {
      toast.error('Không thể thu hồi mã');
    }
  }

  const campaignColumns = useMemo<ColumnDef<AdminV2Campaign>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Campaign',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium hover:underline"
          onClick={() => {
            setSelectedCampaign(row.original);
            setCodePage(1);
          }}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>{STATUS_LABEL[row.original.status]}</Badge>,
    },
    { accessorKey: 'codeCount', header: 'Tổng mã' },
    { accessorKey: 'redeemedCount', header: 'Đã dùng' },
    {
      accessorKey: 'endsAt',
      header: 'Hết hạn',
      cell: ({ row }) => new Date(row.original.endsAt).toLocaleDateString('vi-VN'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Tạo mã"
            onClick={() => {
              setSelectedCampaign(row.original);
              setGenerateOpen(true);
            }}
          >
            <PackagePlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Thu hồi campaign"
            disabled={row.original.status === 'revoked'}
            onClick={() => handleRevokeCampaign(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], []);

  const codeColumns = useMemo<ColumnDef<AdminV2RedeemCodeMetadata>[]>(() => [
    { accessorKey: 'codePrefix', header: 'Prefix' },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <Badge variant={row.original.status === 'unused' ? 'outline' : 'secondary'}>{STATUS_LABEL[row.original.status]}</Badge>,
    },
    { accessorKey: 'batchId', header: 'Batch' },
    {
      accessorKey: 'expiresAt',
      header: 'Hết hạn',
      cell: ({ row }) => row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn',
    },
    {
      accessorKey: 'redeemedAt',
      header: 'Redeem',
      cell: ({ row }) => row.original.redeemedAt ? new Date(row.original.redeemedAt).toLocaleString('vi-VN') : '-',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            title="Thu hồi mã"
            disabled={row.original.status !== 'unused'}
            onClick={() => handleRevokeCode(row.original)}
          >
            <RotateCcw className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campaign mã scan AI</h1>
          <p className="text-muted-foreground text-sm">
            Tạo campaign, bulk code và tải CSV raw code cho vận hành chai sữa.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Tạo campaign</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tổng campaign</p>
          <p className="mt-1 text-2xl font-semibold">{opsPending ? '-' : opsStats?.campaignCount ?? 0}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tổng mã</p>
          <p className="mt-1 text-2xl font-semibold">{opsPending ? '-' : opsStats?.totalCodes ?? 0}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tỷ lệ redeemed</p>
          <p className="mt-1 text-2xl font-semibold">
            {opsPending ? '-' : `${Math.round((opsStats?.redeemedRate ?? 0) * 100)}%`}
          </p>
          <p className="text-xs text-muted-foreground">{opsStats?.redeemedCodes ?? 0} mã đã dùng</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Đang chạy</p>
          <p className="mt-1 text-2xl font-semibold">{opsPending ? '-' : opsStats?.activeCampaigns ?? 0}</p>
        </div>
      </div>

      <div className="rounded-md border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Campaign gần hết hạn</h2>
          <span className="text-xs text-muted-foreground">14 ngày tới</span>
        </div>
        {opsStats?.nearExpiryCampaigns?.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {opsStats.nearExpiryCampaigns.map((campaign) => (
              <div key={campaign._id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.redeemedCount}/{campaign.codeCount} redeemed
                  </p>
                </div>
                <span>{new Date(campaign.endsAt).toLocaleDateString('vi-VN')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Không có campaign sắp hết hạn.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AdminV2CampaignStatus | 'all');
            setPage(1);
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">Nháp</option>
          <option value="active">Đang chạy</option>
          <option value="paused">Tạm dừng</option>
          <option value="ended">Kết thúc</option>
          <option value="revoked">Đã thu hồi</option>
        </select>
      </div>

      <DataTable
        columns={campaignColumns}
        data={data?.items ?? []}
        isLoading={isPending}
        serverPagination={{ page, totalPages: data?.totalPages ?? 1, onPageChange: setPage }}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-t pt-6">
          <div>
            <h2 className="text-lg font-semibold">Mã của campaign</h2>
            <p className="text-sm text-muted-foreground">{selectedName}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={codeStatus}
              onChange={(event) => {
                setCodeStatus(event.target.value as AdminV2RedeemCodeStatus | 'all');
                setCodePage(1);
              }}
              disabled={!selectedCampaign}
            >
              <option value="all">Tất cả mã</option>
              <option value="unused">Chưa dùng</option>
              <option value="redeemed">Đã dùng</option>
              <option value="revoked">Đã thu hồi</option>
              <option value="expired">Hết hạn</option>
            </select>
            <Button disabled={!selectedCampaign} onClick={() => setGenerateOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Generate CSV
            </Button>
          </div>
        </div>
        <DataTable
          columns={codeColumns}
          data={codes?.items ?? []}
          isLoading={codesPending}
          serverPagination={{ page: codePage, totalPages: codes?.totalPages ?? 1, onPageChange: setCodePage }}
        />
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Tạo campaign</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateCampaign}>
            <Input placeholder="Tên campaign" value={campaignForm.name}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))} required />
            <Textarea placeholder="Mô tả" value={campaignForm.description ?? ''}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">Bắt đầu
                <Input type="datetime-local" value={campaignForm.startsAt}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, startsAt: e.target.value }))} required />
              </label>
              <label className="space-y-1 text-sm">Kết thúc
                <Input type="datetime-local" value={campaignForm.endsAt}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, endsAt: e.target.value }))} required />
              </label>
              <label className="space-y-1 text-sm">Ngày hiệu lực
                <Input type="number" min={1} max={365} value={campaignForm.entitlementDurationDays}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, entitlementDurationDays: Number(e.target.value) }))} required />
              </label>
              <label className="space-y-1 text-sm">Scan/ngày
                <Input type="number" min={1} max={500} value={campaignForm.highQuotaDailyLimit}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, highQuotaDailyLimit: Number(e.target.value) }))} required />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending}>Tạo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Tạo batch mã</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleGenerateCodes}>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">Số lượng
                <Input type="number" min={1} max={5000} value={generateForm.quantity}
                  onChange={(e) => setGenerateForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} required />
              </label>
              <label className="space-y-1 text-sm">Độ dài mã
                <Input type="number" min={8} max={24} value={generateForm.codeLength}
                  onChange={(e) => setGenerateForm((prev) => ({ ...prev, codeLength: Number(e.target.value) }))} required />
              </label>
            </div>
            <Input placeholder="Batch label" value={generateForm.batchLabel}
              onChange={(e) => setGenerateForm((prev) => ({ ...prev, batchLabel: e.target.value }))} />
            <Input placeholder="Redeem base URL HTTPS" value={generateForm.redeemBaseUrl}
              onChange={(e) => setGenerateForm((prev) => ({ ...prev, redeemBaseUrl: e.target.value }))} />
            <label className="space-y-1 text-sm">Hết hạn riêng của mã
              <Input type="datetime-local" value={generateForm.codeExpiresAt ?? ''}
                onChange={(e) => setGenerateForm((prev) => ({ ...prev, codeExpiresAt: e.target.value }))} />
            </label>
            <p className="text-xs text-muted-foreground">
              CSV chứa raw code nhạy cảm và chỉ được tải ngay sau khi tạo batch.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={!selectedCampaign || generateMutation.isPending}>Tạo và tải CSV</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
