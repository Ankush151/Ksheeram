import mongoose, { Document, Schema, Model } from 'mongoose';
import { Role } from '@ksheeraam/contracts';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userRole?: Role;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  requestId?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userRole: { type: String, enum: Object.values(Role) },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    requestId: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
