import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

import Campaign from './Campaign';
import UserScanEntitlement from './UserScanEntitlement';
import FoodScanAttempt from './FoodScanAttempt';
import FoodItem from './FoodItem';
import Exercise from './Exercise';
import MediaAsset from './MediaAsset';
import NutMilkPreference from './NutMilkPreference';
import FeedbackPromptState from './FeedbackPromptState';
import AppRating from './AppRating';
import { NUT_MILK_FLAVORS, getNutMilkBmiRule } from '../api/recommendations/nut-milk.rules';

interface SchemaBackedModel {
  schema: {
    indexes: () => Array<[Record<string, unknown>, Record<string, unknown>]>;
    path: (path: string) => { options: { default?: unknown } };
  };
}

const indexExists = (
  model: SchemaBackedModel,
  keys: Record<string, 1 | -1 | 'text'>,
  options?: Record<string, unknown>,
) =>
  model.schema.indexes().some(([indexKeys, indexOptions]) => {
    const keysMatch = Object.entries(keys).every(([key, value]) => indexKeys[key] === value);
    const rawOptions = indexOptions as Record<string, unknown>;
    const optionsMatch = Object.entries(options ?? {}).every(
      ([key, value]) => rawOptions[key] === value,
    );
    return keysMatch && optionsMatch;
  });

const pathDefault = (model: SchemaBackedModel, path: string) =>
  model.schema.path(path).options.default;

test('Campaign stores active windows and finite entitlement policy fields', () => {
  assert.ok(Campaign.schema.path('startsAt'));
  assert.ok(Campaign.schema.path('endsAt'));
  assert.ok(Campaign.schema.path('entitlementDurationDays'));
  assert.ok(Campaign.schema.path('highQuotaDailyLimit'));
  assert.ok(indexExists(Campaign, { status: 1, startsAt: 1, endsAt: 1 }));
});

test('UserScanEntitlement links campaign/code with activeUntil and high daily quota policy', () => {
  assert.ok(UserScanEntitlement.schema.path('activeUntil'));
  assert.ok(UserScanEntitlement.schema.path('campaignId'));
  assert.ok(UserScanEntitlement.schema.path('redeemCodeId'));
  assert.ok(UserScanEntitlement.schema.path('quotaPolicy.dailyLimit'));
  assert.equal(
    pathDefault(UserScanEntitlement, 'quotaPolicy.mode'),
    'high_daily_quota',
  );
  assert.ok(indexExists(UserScanEntitlement, { userId: 1, type: 1, activeUntil: -1 }));
  assert.ok(indexExists(UserScanEntitlement, { redeemCodeId: 1 }, { unique: true }));
});

test('FoodScanAttempt keeps entitlement audit metadata alongside existing quota tracking', () => {
  assert.ok(FoodScanAttempt.schema.path('userId'));
  assert.ok(FoodScanAttempt.schema.path('source'));
  assert.ok(FoodScanAttempt.schema.path('entitlementId'));
  assert.ok(FoodScanAttempt.schema.path('quotaMode'));
  assert.equal(pathDefault(FoodScanAttempt, 'source'), 'daily_quota');
  assert.ok(indexExists(FoodScanAttempt, { entitlementId: 1, createdAt: -1 }, { sparse: true }));
});

test('FoodItem barcodes are string arrays and Vietnamese text search includes brand', () => {
  const barcodePath = FoodItem.schema.path('barcodes') as mongoose.Schema.Types.Array;
  assert.equal(barcodePath.instance, 'Array');
  assert.ok(barcodePath.caster);
  assert.equal(barcodePath.caster.instance, 'String');
  assert.deepEqual(pathDefault(FoodItem, 'barcodes'), []);
  assert.ok(indexExists(FoodItem, { barcodes: 1 }, { sparse: true }));
  assert.ok(indexExists(FoodItem, { name: 'text', nameEn: 'text', brand: 'text' }, {
    default_language: 'none',
  }));
});

test('Exercise keeps imageUrl compatibility and optional imageAssetId media reference', () => {
  assert.ok(Exercise.schema.path('imageUrl'));
  assert.ok(Exercise.schema.path('imageAssetId'));
  assert.equal(pathDefault(Exercise, 'imageUrl'), null);
  assert.ok(indexExists(Exercise, { imageAssetId: 1 }, { sparse: true }));
});

test('MediaAsset stores source, batchId, status, assignment, and asset metadata without MediaBatch', () => {
  assert.ok(MediaAsset.schema.path('source'));
  assert.ok(MediaAsset.schema.path('batchId'));
  assert.ok(MediaAsset.schema.path('status'));
  assert.ok(MediaAsset.schema.path('publicId'));
  assert.ok(MediaAsset.schema.path('url'));
  assert.ok(MediaAsset.schema.path('metadata'));
  assert.ok(MediaAsset.schema.path('assignedExerciseId'));
  assert.equal(pathDefault(MediaAsset, 'status'), 'uploaded');
  assert.equal(mongoose.models.MediaBatch, undefined);
  assert.ok(indexExists(MediaAsset, { batchId: 1, createdAt: -1 }, { sparse: true }));
});

test('NutMilkPreference is separate from User and static recommendation rules are code constants', () => {
  assert.equal(NutMilkPreference.modelName, 'NutMilkPreference');
  assert.ok(NutMilkPreference.schema.path('selectedFlavorId'));
  assert.ok(NutMilkPreference.schema.path('needSignals.stressOrSleep'));
  assert.equal(NUT_MILK_FLAVORS.length, 5);
  assert.equal(getNutMilkBmiRule(18.4), 'lt_18_5');
  assert.equal(getNutMilkBmiRule(22.9), 'range_18_5_22_9');
  assert.equal(getNutMilkBmiRule(23), 'boundary_23');
  assert.equal(getNutMilkBmiRule(23.1), 'gt_23');
});

test('FeedbackPromptState and AppRating are separate internal feedback contracts', () => {
  assert.equal(FeedbackPromptState.modelName, 'FeedbackPromptState');
  assert.ok(FeedbackPromptState.schema.path('cooldownUntil'));
  assert.ok(FeedbackPromptState.schema.path('triggerCounts'));
  assert.ok(indexExists(FeedbackPromptState, { userId: 1, promptKey: 1 }, { unique: true }));

  assert.equal(AppRating.modelName, 'AppRating');
  assert.ok(AppRating.schema.path('stars'));
  assert.ok(AppRating.schema.path('comment'));
  assert.ok(AppRating.schema.path('trigger'));
  assert.ok(AppRating.schema.path('storeReviewRequested'));
  assert.equal(pathDefault(AppRating, 'storeReviewRequested'), false);
});
