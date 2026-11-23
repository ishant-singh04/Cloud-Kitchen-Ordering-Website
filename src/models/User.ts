import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress {
  _id?: string;
  label: string; // e.g., "Home", "Work", "Apartment"
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'admin' | 'kitchen' | 'delivery';
  addresses: IAddress[];
  favorites: mongoose.Types.ObjectId[];
  vehicleType?: string;
  vehicleNumber?: string;
  isAvailable?: boolean;
  activeStatus?: 'active' | 'inactive';
  totalDeliveriesCompleted?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, required: true, default: 'Home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['customer', 'admin', 'kitchen', 'delivery'],
      default: 'customer',
      required: true,
    },
    addresses: [AddressSchema],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    vehicleType: { type: String, default: 'Bike' },
    vehicleNumber: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    activeStatus: { type: String, enum: ['active', 'inactive'], default: 'active' },
    totalDeliveriesCompleted: { type: Number, default: 0 },
    rating: { type: Number, default: 4.9 },
  },
  { timestamps: true }
);

// Prevent re-compilation of model in development hot reloading
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
