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
    flavorId: 'gao_lut_oc_cho_hanh_nhan',
    nameVi: 'Gạo lứt - Óc chó - Hạnh nhân',
    bmiRule: 'lt_18_5',
    positioningVi:
      'Xin vía ăn hoài không béo! Nhưng giao diện hơi gầy rồi nha đồng Ủ ơi. Nạp gấp năng lượng để có sức gánh team cuối kỳ!',
  },
  {
    flavorId: 'hat_sen_oc_cho',
    nameVi: 'Hạt sen - Óc chó',
    bmiRule: 'lt_18_5',
    positioningVi:
      'Ốm nhom rồi đó nha! Trạm sạc AI yêu cầu bạn nạp ngay chai này để bồi bổ khí huyết, phục hồi công lực ngay tắp lự.',
  },
  {
    flavorId: 'dau_nanh_dau_xanh',
    nameVi: 'Đậu nành - Đậu xanh',
    bmiRule: 'lt_18_5',
    positioningVi:
      "Vóc dáng thanh mảnh xinh đó, nhưng thêm xíu 'cơ bắp' để chạy deadline cho khỏe nhé!",
  },
  {
    flavorId: 'cafe_dua_hat_dieu_dau_nanh',
    nameVi: 'Cafe dừa - Hạt điều - Đậu nành',
    bmiRule: 'range_18_5_22_9',
    positioningVi:
      "Vóc dáng 10 điểm không có nhưng! Uống thêm chút 'doping' này để nảy số ầm ầm cho bài thuyết trình ngày mai nhé.",
  },
  {
    flavorId: 'rau_ma_hat_sen',
    nameVi: 'Rau má - Hạt sen',
    bmiRule: 'range_18_5_22_9',
    positioningVi:
      'Giao diện mlem quá! Giữ vững phong độ đỉnh cao này bằng cách hạ hỏa, dưỡng nhan thanh mát từ bên trong nha.',
  },
  {
    flavorId: 'gao_lut_me_den_hat_sen',
    nameVi: 'Gạo lứt - Mè đen - Hạt sen',
    bmiRule: 'gt_23',
    positioningVi:
      'Tướng có hậu lắm nha! Nhưng để lên đồ mùa hè cực cháy thì mình cùng detox, đánh bay bé mỡ xíu nào!',
  },
  {
    flavorId: 'rau_ma_sua_dua',
    nameVi: 'Rau má - Sữa dừa',
    bmiRule: 'gt_23',
    positioningVi:
      'Vẫn là slay, nhưng thanh lọc cơ thể xíu cho nhẹ bụng, tự tin diện đồ hè nha đồng Ủ ơi!',
  },
] as const;

export function getNutMilkBmiRule(bmi: number): NutMilkBmiRule | 'boundary_23' {
  if (bmi < 18.5) return 'lt_18_5';
  if (bmi < 25) return 'range_18_5_22_9';
  return 'gt_23';
}
