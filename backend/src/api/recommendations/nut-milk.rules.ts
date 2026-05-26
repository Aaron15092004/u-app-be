export type NutMilkBmiRule = 'lt_18_5' | 'range_18_5_22_9' | 'gt_23' | 'any';
export type NutMilkNeedSignal = 'stress_sleep' | 'energy_memory';

export interface NutMilkFlavorRule {
  flavorId: string;
  nameVi: string;
  bmiRule: NutMilkBmiRule;
  needSignal?: NutMilkNeedSignal;
  positioningVi: string;
}

export const NUT_MILK_FLAVORS: readonly NutMilkFlavorRule[] = [
  {
    flavorId: 'rau_ma_sua_dua',
    nameVi: 'Rau ma sua dua',
    bmiRule: 'gt_23',
    positioningVi: 'Thanh nhiet va kiem soat can nang',
  },
  {
    flavorId: 'rau_ma_hat_sen',
    nameVi: 'Rau ma - Hat sen',
    bmiRule: 'any',
    needSignal: 'stress_sleep',
    positioningVi: 'Giam stress va ngu ngon sau giac',
  },
  {
    flavorId: 'gao_lut_me_den_hat_sen',
    nameVi: 'Gao lut - Me den - Hat sen',
    bmiRule: 'range_18_5_22_9',
    positioningVi: 'Duy tri voc dang va dep da, chong lao hoa',
  },
  {
    flavorId: 'gao_lut_oc_cho_hanh_nhan',
    nameVi: 'Gao lut - Oc cho - Hanh nhan',
    bmiRule: 'lt_18_5',
    positioningVi: 'Bo sung dinh duong va tang cuong tri nao',
  },
  {
    flavorId: 'hat_sen_oc_cho',
    nameVi: 'Hat sen - Oc cho',
    bmiRule: 'any',
    needSignal: 'energy_memory',
    positioningVi: 'Phuc hoi nang luong va tri nho ben bi',
  },
] as const;

export function getNutMilkBmiRule(bmi: number): NutMilkBmiRule | 'boundary_23' {
  if (bmi < 18.5) return 'lt_18_5';
  if (bmi <= 22.9) return 'range_18_5_22_9';
  if (bmi > 23) return 'gt_23';
  return 'boundary_23';
}
