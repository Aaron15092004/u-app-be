import mongoose from 'mongoose';
import AppRating from '../../models/AppRating';
import FeedbackPromptState from '../../models/FeedbackPromptState';
import { SubmitAppRatingInput } from './ratings.validation';

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

  return state;
}

export async function submitRating(userId: string, input: SubmitAppRatingInput): Promise<object> {
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
        submittedAt: new Date(),
      },
      $inc: {
        [`triggerCounts.${input.trigger}`]: 1,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return rating.toObject();
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
