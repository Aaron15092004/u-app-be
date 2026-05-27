import mongoose from 'mongoose';
import AppRating from '../../models/AppRating';
import FeedbackPromptState from '../../models/FeedbackPromptState';
import { DismissRatingPromptInput, SubmitAppRatingInput } from './ratings.validation';

const RATING_PROMPT_COOLDOWN_DAYS = 14;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

export interface ListRatingsFilters {
  page: number;
  limit: number;
}

export async function getPromptStatus(userId: string): Promise<object> {
  const state = await FeedbackPromptState.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    promptKey: 'app_rating',
  }).lean();

  if (!state) {
    return {
      promptKey: 'app_rating',
      status: 'eligible',
      cooldownUntil: null,
      triggerCounts: {},
    };
  }

  if (state.cooldownUntil && state.cooldownUntil.getTime() > Date.now()) {
    return {
      ...state,
      status: 'cooldown',
      cooldownUntil: state.cooldownUntil,
      message: 'Tam an nhac danh gia trong thoi gian cooldown',
    };
  }

  return state;
}

export async function submitRating(userId: string, input: SubmitAppRatingInput): Promise<object> {
  const now = new Date();
  const cooldownUntil = addDays(now, RATING_PROMPT_COOLDOWN_DAYS);
  const storeReviewEligible = input.stars >= 4;
  const rating = await AppRating.create({
    userId: new mongoose.Types.ObjectId(userId),
    stars: input.stars,
    comment: input.comment,
    trigger: input.trigger,
    appVersion: input.appVersion,
    platform: input.platform,
    deviceInfo: input.deviceInfo ?? {},
    storeReviewRequested: input.storeReviewRequested ?? false,
  });

  await FeedbackPromptState.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      promptKey: 'app_rating',
    },
    {
      $set: {
        status: 'submitted',
        submittedAt: now,
        cooldownUntil,
      },
      $inc: {
        [`triggerCounts.${input.trigger}`]: 1,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    ...rating.toObject(),
    storeReviewEligible,
  };
}

export async function dismissPrompt(
  userId: string,
  input: DismissRatingPromptInput,
): Promise<object> {
  const now = new Date();
  const cooldownUntil = addDays(now, RATING_PROMPT_COOLDOWN_DAYS);

  return FeedbackPromptState.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      promptKey: 'app_rating',
    },
    {
      $set: {
        status: 'dismissed',
        dismissedAt: now,
        cooldownUntil,
      },
      $inc: {
        [`triggerCounts.${input.trigger}`]: 1,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

export async function listRatings(filters: ListRatingsFilters): Promise<object> {
  const skip = (filters.page - 1) * filters.limit;
  const [items, total] = await Promise.all([
    AppRating.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(filters.limit)
      .populate('userId', 'email name')
      .lean(),
    AppRating.countDocuments({}),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit) || 1,
  };
}

export async function getRatingsDashboard(): Promise<object> {
  const [summary] = await AppRating.aggregate<{
    total: number;
    averageStars: number;
    distribution: Array<{ stars: number; count: number }>;
  }>([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              averageStars: { $avg: '$stars' },
            },
          },
        ],
        distribution: [
          { $group: { _id: '$stars', count: { $sum: 1 } } },
          { $project: { _id: 0, stars: '$_id', count: 1 } },
          { $sort: { stars: -1 } },
        ],
      },
    },
    {
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ['$totals.total', 0] }, 0] },
        averageStars: { $ifNull: [{ $arrayElemAt: ['$totals.averageStars', 0] }, 0] },
        distribution: 1,
      },
    },
  ]);

  const recentComments = await AppRating.find({ comment: { $exists: true, $ne: '' } })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('userId', 'email name')
    .lean();

  const distributionMap = new Map<number, number>(
    (summary?.distribution ?? []).map((item) => [item.stars, item.count]),
  );

  return {
    total: summary?.total ?? 0,
    averageStars: summary?.averageStars ?? 0,
    distribution: [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: distributionMap.get(stars) ?? 0,
    })),
    recentComments,
  };
}
