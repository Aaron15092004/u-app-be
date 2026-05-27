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
    nameVi: 'Rau má sữa dừa',
    bmiRule: 'gt_23',
    positioningVi: 'Thanh nhiệt và kiểm soát cân nặng',
  },
  {
    flavorId: 'rau_ma_hat_sen',
    nameVi: 'Rau má - Hạt sen',
    bmiRule: 'any',
    needSignal: 'stress_sleep',
    positioningVi: 'Giảm stress và ngủ ngon sâu giấc',
  },
  {
    flavorId: 'gao_lut_me_den_hat_sen',
    nameVi: 'Gạo lứt - Mè đen - Hạt sen',
    bmiRule: 'range_18_5_22_9',
    positioningVi: 'Duy trì vóc dáng và đẹp da, chống lão hóa',
  },
  {
    flavorId: 'gao_lut_oc_cho_hanh_nhan',
    nameVi: 'Gạo lứt - Óc chó - Hạnh nhân',
    bmiRule: 'lt_18_5',
    positioningVi: 'Bổ sung dinh dưỡng và tăng cường trí não',
  },
  {
    flavorId: 'hat_sen_oc_cho',
    nameVi: 'Hạt sen - Óc chó',
    bmiRule: 'any',
    needSignal: 'energy_memory',
    positioningVi: 'Phục hồi năng lượng và trí nhớ bền bỉ',
  },
] as const;

export function getNutMilkBmiRule(bmi: number): NutMilkBmiRule | 'boundary_23' {
  if (bmi < 18.5) return 'lt_18_5';
  if (bmi <= 22.9) return 'range_18_5_22_9';
  if (bmi > 23) return 'gt_23';
  return 'boundary_23';
}
