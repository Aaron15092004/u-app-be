import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const TARGET_TOTAL_USERS = 197;
const SEED_PASSWORD = 'Seed@12345';

const SURNAMES = [
  'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu',
  'Vo', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Duong', 'Ly',
];

const MIDDLE_NAMES_VI = [
  'Văn', 'Thị', 'Hữu', 'Thành', 'Minh', 'Đức', 'Ngọc', 'Thu',
  'Xuân', 'Kim', 'Anh', 'Bảo', 'Gia', 'Hoàng', 'Quang', 'Thanh',
];

const GIVEN_NAMES_VI = [
  'An', 'Binh', 'Chi', 'Dung', 'Giang', 'Ha', 'Hai', 'Hung',
  'Huong', 'Khanh', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Ngan',
  'Nhi', 'Phong', 'Phuong', 'Quan', 'Quynh', 'Son', 'Tam', 'Thao',
  'Thang', 'Thuy', 'Tien', 'Trang', 'Trung', 'Tuan', 'Tu', 'Uyen',
  'Viet', 'Vy', 'Yen',
];

const SURNAMES_VI = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ',
  'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysBack: number): Date {
  const now = Date.now();
  const past = now - randomInt(0, daysBack) * 86400000 - randomInt(0, 86399) * 1000;
  return new Date(past);
}

function buildDisplayName(): string {
  const surnameIdx = randomInt(0, SURNAMES_VI.length - 1);
  const middle = pick(MIDDLE_NAMES_VI);
  const given = pick(GIVEN_NAMES_VI);
  return `${SURNAMES_VI[surnameIdx]} ${middle} ${given}`;
}

function buildEmail(usedEmails: Set<string>): string {
  const surname = pick(SURNAMES).toLowerCase();
  const given = pick(GIVEN_NAMES_VI).toLowerCase();
  let email = '';
  let attempt = 0;
  do {
    const suffix = attempt === 0 ? randomInt(1, 999) : randomInt(1000, 99999);
    email = `${given}${surname}${suffix}@gmail.com`;
    attempt += 1;
  } while (usedEmails.has(email));
  usedEmails.add(email);
  return email;
}

async function seed(): Promise<void> {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const currentCount = await User.countDocuments({});
  const toCreate = TARGET_TOTAL_USERS - currentCount;

  if (toCreate <= 0) {
    console.log(`Already have ${currentCount} users (target ${TARGET_TOTAL_USERS}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Current users: ${currentCount}. Creating ${toCreate} more to reach ${TARGET_TOTAL_USERS}...`);

  const existingEmails = new Set((await User.find({}, 'email').lean()).map((u) => u.email));
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const genders = ['male', 'female', 'other'] as const;
  const goalTypes = ['lose', 'maintain', 'gain'] as const;

  const docs = Array.from({ length: toCreate }, () => {
    const email = buildEmail(existingEmails);
    const createdAt = randomPastDate(180);
    return {
      email,
      passwordHash,
      name: buildDisplayName(),
      role: 'user' as const,
      isActive: true,
      profileCompleted: Math.random() < 0.7,
      profile: {
        age: randomInt(18, 45),
        gender: pick(genders),
        heightCm: randomInt(150, 180),
        weightKg: randomInt(45, 85),
        goalType: pick(goalTypes),
      },
      createdAt,
      updatedAt: createdAt,
    };
  });

  await User.insertMany(docs, { ordered: false });

  const finalCount = await User.countDocuments({});
  console.log(`Done. Users in DB: ${finalCount}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
