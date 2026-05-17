import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthCheckLog extends Document {
  checkedAt: Date;
  host: string;
}

const HealthCheckLogSchema = new Schema<IHealthCheckLog>({
  checkedAt: { type: Date, required: true, default: Date.now },
  host: { type: String, default: 'health' },
});

HealthCheckLogSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.model<IHealthCheckLog>('HealthCheckLog', HealthCheckLogSchema);
