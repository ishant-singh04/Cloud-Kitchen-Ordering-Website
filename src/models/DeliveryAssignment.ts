import mongoose, { Schema, Document, Model } from 'mongoose';

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'REASSIGNMENT_REQUIRED';

export interface IDeliveryAssignment extends Document {
  orderId: mongoose.Types.ObjectId;
  deliveryStaffId: mongoose.Types.ObjectId;
  deliveryStaffName: string;
  deliveryStaffPhone: string;
  status: DeliveryStatus;
  deliveryOtp: string;
  otpVerified: boolean;
  assignedAt: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  notes?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryAssignmentSchema = new Schema<IDeliveryAssignment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    deliveryStaffId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deliveryStaffName: { type: String, required: true },
    deliveryStaffPhone: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'ASSIGNED',
        'ACCEPTED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'DELIVERY_FAILED',
        'CANCELLED',
        'REASSIGNMENT_REQUIRED',
      ],
      default: 'ASSIGNED',
      required: true,
      index: true,
    },
    deliveryOtp: { type: String, required: true },
    otpVerified: { type: Boolean, default: false },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    notes: { type: String },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const DeliveryAssignment: Model<IDeliveryAssignment> =
  mongoose.models.DeliveryAssignment ||
  mongoose.model<IDeliveryAssignment>('DeliveryAssignment', DeliveryAssignmentSchema);

export default DeliveryAssignment;
