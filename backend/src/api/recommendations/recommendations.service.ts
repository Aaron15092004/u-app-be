import mongoose from 'mongoose';
import NutMilkPreference from '../../models/NutMilkPreference';
import { getNutMilkBmiRule, NUT_MILK_FLAVORS } from './nut-milk.rules';
import { SelectNutMilkFlavorInput } from './recommendations.validation';

export interface GetNutMilkRulesInput {
  bmi?: number;
  stressOrSleep?: boolean;
  energyOrMemory?: boolean;
}

function toBmiCategory(bmiRule: ReturnType<typeof getNutMilkBmiRule> | null) {
  if (bmiRule === 'lt_18_5') return 'underweight';
  if (bmiRule === 'range_18_5_22_9') return 'normal';
  if (bmiRule === 'gt_23') return 'overweight';
  if (bmiRule === 'boundary_23') return 'boundary_23';
  return undefined;
}

export async function getNutMilkRules(userId: string, input: GetNutMilkRulesInput = {}) {
  const bmiRule = typeof input.bmi === 'number' ? getNutMilkBmiRule(input.bmi) : null;
  const currentPreference = await NutMilkPreference.findOne({
    userId: new mongoose.Types.ObjectId(userId),
  }).sort({ updatedAt: -1 }).lean();

  return {
    bmiRule,
    signals: {
      stressOrSleep: input.stressOrSleep === true,
      energyOrMemory: input.energyOrMemory === true,
    },
    flavors: NUT_MILK_FLAVORS,
    currentPreference,
    disclaimer:
      'Goi y sua hat la goi y san pham theo so thich va chi so co the, khong phai chan doan hay dieu tri y khoa.',
  };
}

export async function saveNutMilkSelection(userId: string, input: SelectNutMilkFlavorInput) {
  const bmiRule = typeof input.bmi === 'number' ? getNutMilkBmiRule(input.bmi) : null;
  const preference = await NutMilkPreference.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        selectedFlavorId: input.selectedFlavorId,
        recommendedFlavorId: input.recommendedFlavorId,
        bmi: input.bmi,
        bmiCategory: toBmiCategory(bmiRule),
        needSignals: {
          stressOrSleep: input.signals?.stressOrSleep === true,
          energyMemory: input.signals?.energyOrMemory === true,
        },
        source: input.source,
        selectedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return preference;
}
