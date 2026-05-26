import { getNutMilkBmiRule, NUT_MILK_FLAVORS } from './nut-milk.rules';

export interface GetNutMilkRulesInput {
  bmi?: number;
  stressOrSleep?: boolean;
  energyOrMemory?: boolean;
}

export function getNutMilkRules(input: GetNutMilkRulesInput = {}) {
  const bmiRule = typeof input.bmi === 'number' ? getNutMilkBmiRule(input.bmi) : null;

  return {
    bmiRule,
    signals: {
      stressOrSleep: input.stressOrSleep === true,
      energyOrMemory: input.energyOrMemory === true,
    },
    flavors: NUT_MILK_FLAVORS,
    disclaimer:
      'Goi y sua hat la goi y san pham theo so thich va chi so co the, khong phai chan doan hay dieu tri y khoa.',
  };
}
