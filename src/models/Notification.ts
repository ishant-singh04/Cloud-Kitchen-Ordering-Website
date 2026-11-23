import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientId?: mongoose.Types.ObjectId;
  targetRole?: 'admin' | 'kitchen' | 'delivery' | 'customer';
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'inventory' | 'payment' | 'system';
  referenceId?: string; // e.g. orderId
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    targetRole: { type: String, enum: ['admin', 'kitchen', 'delivery', 'customer'] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'delivery', 'inventory', 'payment', 'system'], default: 'system' },
    referenceId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ targetRole: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
