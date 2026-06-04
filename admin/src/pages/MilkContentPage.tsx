import { useMemo, useState } from 'react';
import { ExternalLink, Milk, QrCode, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UpdateMilkPageContentInput,
  useMilkPageContent,
  useUpdateMilkPageContent,
} from '@/features/app-content/useMilkPageContent';

const BMI_LABELS: Record<string, string> = {
  lt_18_5: 'BMI < 18.5',
  range_18_5_22_9: 'BMI 18.5 - 24.9',
  gt_23: 'BMI >= 25',
  any: 'Mọi BMI',
};

export function MilkContentPage() {
  const { data, isPending } = useMilkPageContent();
  const updateMutation = useUpdateMilkPageContent();
  const [draft, setDraft] = useState<UpdateMilkPageContentInput | null>(null);

  const content = useMemo(() => {
    if (!data) return null;
    return {
      ...data,
      flavors: data.flavors.map((flavor) => ({
        ...flavor,
        imageUrl: draft?.milkImages?.[flavor.flavorId] ?? flavor.imageUrl ?? null,
      })),
      download: {
        ...data.download,
        ...(draft?.download ?? {}),
      },
    };
  }, [data, draft]);

  function setMilkImage(flavorId: string, imageUrl: string | null) {
    setDraft((current) => ({
      ...current,
      milkImages: {
        ...(current?.milkImages ?? {}),
        [flavorId]: imageUrl,
      },
    }));
  }

  function setDownloadField(key: keyof NonNullable<UpdateMilkPageContentInput['download']>, value: string | null) {
    setDraft((current) => ({
      ...current,
      download: {
        ...(current?.download ?? {}),
        [key]: value,
      },
    }));
  }

  async function save() {
    if (!draft) return;
    try {
      await updateMutation.mutateAsync(draft);
      setDraft(null);
      toast('Đã lưu nội dung trang sữa Ủ');
    } catch {
      toast.error('Không thể lưu nội dung');
    }
  }

  if (isPending) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!content) {
    return <div className="p-8 text-muted-foreground">Không tải được nội dung.</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sữa Ủ & tải app</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý ảnh các vị sữa Ủ và QR tải app hiển thị trên web public.
          </p>
        </div>
        <Button onClick={save} disabled={!draft || updateMutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Khu tải app
          </CardTitle>
          <CardDescription>Link và ảnh QR cho App Store / CH Play.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input
              value={content.download.headlineVi ?? ''}
              onChange={(event) => setDownloadField('headlineVi', event.target.value)}
            />
            <label className="text-sm font-medium">Mô tả</label>
            <Input
              value={content.download.copyVi ?? ''}
              onChange={(event) => setDownloadField('copyVi', event.target.value)}
            />
            <label className="text-sm font-medium">App Store URL</label>
            <Input
              value={content.download.appStoreUrl ?? ''}
              onChange={(event) => setDownloadField('appStoreUrl', event.target.value)}
            />
            <label className="text-sm font-medium">CH Play URL</label>
            <Input
              value={content.download.playStoreUrl ?? ''}
              onChange={(event) => setDownloadField('playStoreUrl', event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">QR App Store</span>
                {content.download.appStoreUrl ? (
                  <a href={content.download.appStoreUrl} target="_blank" rel="noreferrer" className="text-xs text-primary">
                    <ExternalLink className="inline h-3 w-3" /> Mở link
                  </a>
                ) : null}
              </div>
              <ImageUploadField
                folder="app-download"
                value={content.download.appStoreQrUrl}
                onChange={(url) => setDownloadField('appStoreQrUrl', url)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">QR CH Play</span>
                {content.download.playStoreUrl ? (
                  <a href={content.download.playStoreUrl} target="_blank" rel="noreferrer" className="text-xs text-primary">
                    <ExternalLink className="inline h-3 w-3" /> Mở link
                  </a>
                ) : null}
              </div>
              <ImageUploadField
                folder="app-download"
                value={content.download.playStoreQrUrl}
                onChange={(url) => setDownloadField('playStoreQrUrl', url)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {content.flavors.map((flavor) => (
          <Card key={flavor.flavorId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Milk className="h-4 w-4" />
                {flavor.nameVi}
              </CardTitle>
              <CardDescription>{BMI_LABELS[flavor.bmiRule] ?? flavor.bmiRule}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ImageUploadField
                folder="nut-milk"
                value={flavor.imageUrl}
                onChange={(url) => setMilkImage(flavor.flavorId, url)}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">{flavor.positioningVi}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
