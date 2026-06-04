import AppContent from '../../models/AppContent';
import { NUT_MILK_FLAVORS } from '../recommendations/nut-milk.rules';

export interface MilkPageContentInput {
  milkImages?: Record<string, string | null | undefined>;
  download?: {
    appStoreUrl?: string | null;
    playStoreUrl?: string | null;
    appStoreQrUrl?: string | null;
    playStoreQrUrl?: string | null;
    headlineVi?: string | null;
    copyVi?: string | null;
  };
}

const MILK_PAGE_KEY = 'milk-page';

const DEFAULT_DOWNLOAD = {
  appStoreUrl: 'https://apps.apple.com/app/id6775761007',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.uapp.health',
  appStoreQrUrl: null,
  playStoreQrUrl: null,
  headlineVi: 'Tải app Ủ',
  copyVi: 'Theo dõi sức khỏe, bữa ăn, tập luyện và nhận gợi ý sữa Ủ phù hợp ngay trên điện thoại.',
};

function normalizeValue(value: unknown): MilkPageContentInput {
  if (!value || typeof value !== 'object') return {};
  const raw = value as MilkPageContentInput;
  return {
    milkImages: raw.milkImages ?? {},
    download: raw.download ?? {},
  };
}

export async function getMilkPageContent() {
  const doc = await AppContent.findOne({ key: MILK_PAGE_KEY }).lean();
  const value = normalizeValue(doc?.value);
  const milkImages = value.milkImages ?? {};
  const download = { ...DEFAULT_DOWNLOAD, ...(value.download ?? {}) };

  return {
    flavors: NUT_MILK_FLAVORS.map((flavor) => ({
      ...flavor,
      imageUrl: milkImages[flavor.flavorId] || null,
    })),
    download,
    updatedAt: doc?.updatedAt ?? null,
  };
}

export async function updateMilkPageContent(input: MilkPageContentInput, adminId: string) {
  const current = await getMilkPageContent();
  const nextMilkImages: Record<string, string | null> = {};
  for (const flavor of NUT_MILK_FLAVORS) {
    const existing = current.flavors.find((item) => item.flavorId === flavor.flavorId)?.imageUrl ?? null;
    nextMilkImages[flavor.flavorId] =
      input.milkImages && Object.prototype.hasOwnProperty.call(input.milkImages, flavor.flavorId)
        ? input.milkImages[flavor.flavorId] || null
        : existing;
  }

  const nextDownload = {
    ...current.download,
    ...(input.download ?? {}),
  };

  await AppContent.findOneAndUpdate(
    { key: MILK_PAGE_KEY },
    {
      $set: {
        value: {
          milkImages: nextMilkImages,
          download: nextDownload,
        },
        updatedBy: adminId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return getMilkPageContent();
}
