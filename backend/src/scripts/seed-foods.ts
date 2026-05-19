import 'dotenv/config';
import mongoose from 'mongoose';
import FoodItem from '../models/FoodItem';
import foodData from './data/vietnamese-foods.json';

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const count = await FoodItem.countDocuments();
  console.log(`Found ${count} existing FoodItem documents`);

  if (count >= 50) {
    console.log('FoodItem collection already seeded (>= 50 items). Skipping.');
    await mongoose.disconnect();
    return;
  }

  const items = foodData.map(item => ({ ...item, source: (item.source || 'manual') as 'manual' | 'openfoods' }));
  const result = await FoodItem.insertMany(items, { ordered: false });
  console.log(`Seeded ${result.length} Vietnamese food items`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect().finally(() => process.exit(1));
});
