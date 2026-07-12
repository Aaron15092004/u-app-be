import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User';
import AppRating from '../models/AppRating';

const REVIEWS_TO_CREATE = 50;

const MILK_FLAVORS_VI = [
  'Gạo lứt - Óc chó - Hạnh nhân',
  'Hạt sen - Óc chó',
  'Đậu nành - Đậu xanh',
  'Cafe dừa - Hạt điều - Đậu nành',
  'Rau má - Hạt sen',
  'Gạo lứt - Mè đen - Hạt sen',
  'Rau má - Sữa dừa',
];

const COMMENT_TEMPLATES: Array<(flavor: string) => string> = [
  (f) => `Sữa ${f} của Ủ uống ngon xuất sắc, vị thanh không quá ngọt. Mình ghiền luôn rồi!`,
  (f) => `Lần đầu thử vị ${f} mà mê ngay, nguyên liệu sạch thấy rõ, uống xong thấy khỏe hẳn.`,
  (f) => `App gợi ý mình uống sữa ${f} theo BMI, uống 2 tuần thấy đỡ mệt hơn hẳn. 5 sao cho Ủ!`,
  (f) => `Sữa ${f} đóng chai tiện mang đi làm, vị béo nhẹ tự nhiên, không hề gắt cổ.`,
  (f) => `Ủ tư vấn đúng gu mình, chọn ${f} là chuẩn bài luôn. Sẽ ủng hộ dài dài.`,
  (f) => `Thấy nhiều người khen nên thử vị ${f}, đúng là không làm mình thất vọng, ngon và lành.`,
  (f) => `Uống sữa ${f} mỗi sáng thay bữa phụ, bụng nhẹ mà vẫn đủ năng lượng làm việc.`,
  (f) => `Chất lượng sữa ${f} ổn định qua nhiều lần mua, đóng gói kỹ, giao hàng nhanh.`,
  (f) => `Team Ủ chăm sóc khách hàng nhiệt tình, sữa ${f} lại còn ngon nữa thì hết chỗ chê.`,
  (f) => `Vị ${f} hợp khẩu vị người Việt, không quá ngọt như mấy loại sữa hạt ngoại nhập.`,
  (f) => `Con mình uống sữa ${f} của Ủ cũng thích, mùi thơm tự nhiên chứ không hoá chất.`,
  (f) => `Đang giảm cân nên dùng sữa ${f} thay bữa sáng, no lâu mà không lo tăng cân.`,
  (f) => `Sữa ${f} uống lạnh hay ấm đều ngon, đóng chai thuỷ tinh nhìn sang, yên tâm chất lượng.`,
  (f) => `Ủ update app ngày càng mượt, đặt sữa ${f} vài cú chạm là xong, quá tiện lợi.`,
  (f) => `Giá sữa ${f} hợp lý so với chất lượng, sẽ giới thiệu bạn bè dùng thử.`,
];

const TRIGGERS = ['manual', 'food_scan_saved', 'habit_streak', 'profile_prompt'] as const;
const PLATFORMS = ['ios', 'android'] as const;
const APP_VERSIONS = ['1.3.0', '1.3.2', '1.4.0', '1.4.1'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStars(): number {
  const roll = Math.random();
  if (roll < 0.65) return 5;
  if (roll < 0.9) return 4;
  return 3;
}

function randomRecentDate(daysBack: number): Date {
  const now = Date.now();
  const past = now - randomInt(0, daysBack) * 86400000 - randomInt(0, 86399) * 1000;
  return new Date(past);
}

async function seed(): Promise<void> {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const sampleSize = Math.min(REVIEWS_TO_CREATE, await User.countDocuments({}));
  if (sampleSize === 0) {
    throw new Error('No users found in DB — seed users before seeding reviews.');
  }

  const reviewers = await User.aggregate([{ $sample: { size: REVIEWS_TO_CREATE } }, { $project: { _id: 1 } }]);

  const docs = Array.from({ length: REVIEWS_TO_CREATE }, (_, i) => {
    const reviewer = reviewers[i % reviewers.length];
    const flavor = pick(MILK_FLAVORS_VI);
    const template = pick(COMMENT_TEMPLATES);
    const stars = randomStars();
    const createdAt = randomRecentDate(60);
    return {
      userId: reviewer._id,
      stars,
      comment: template(flavor),
      trigger: pick(TRIGGERS),
      appVersion: pick(APP_VERSIONS),
      platform: pick(PLATFORMS),
      deviceInfo: {},
      storeReviewRequested: stars >= 4,
      createdAt,
      updatedAt: createdAt,
    };
  });

  await AppRating.insertMany(docs, { ordered: false });

  const total = await AppRating.countDocuments({});
  console.log(`Done. Created ${docs.length} reviews. Total reviews in DB: ${total}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
