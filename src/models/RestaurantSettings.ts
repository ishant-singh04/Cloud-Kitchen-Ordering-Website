import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRestaurantSettings extends Document {
  name: string;
  tagline: string;
  description: string;
  logo?: string;
  phone: string;
  email: string;
  address: string;
  openingTime: string;
  closingTime: string;
  weeklyClosingDays: string[]; // e.g. ['Monday'] or empty
  defaultPrepTimeMinutes: number;
  deliveryFee: number;
  minOrderAmount: number;
  minOrderForFreeDelivery: number;
  taxRatePercentage: number;
  deliveryRadiusKm: number;
  estimatedDeliveryTimeMinutes: number;
  currencySymbol: string;
  currencyCode: string;
  
  // Feature Toggles
  isKitchenAcceptingOrders: boolean;
  isOnlineOrderingEnabled: boolean;
  isCodEnabled: boolean;
  isOnlinePaymentEnabled: boolean;
  isDeliveryEnabled: boolean;
  isPickupEnabled: boolean;
  
  // Social links
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  
  updatedAt: Date;
}

const RestaurantSettingsSchema = new Schema<IRestaurantSettings>(
  {
    name: { type: String, default: 'CloudKitchen Pro' },
    tagline: { type: String, default: 'Artisanal Flavors, Delivered Hot & Fresh' },
    description: {
      type: String,
      default: 'Premium gourmet cloud kitchen serving handcrafted delicacies crafted with organic ingredients.',
    },
    logo: { type: String, default: '/images/logo.png' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'orders@cloudkitchenpro.com' },
    address: {
      type: String,
      default: 'Kitchen #4, Gourmet Hub, Outer Ring Road, Bengaluru, Karnataka 560103',
    },
    openingTime: { type: String, default: '10:00 AM' },
    closingTime: { type: String, default: '11:30 PM' },
    weeklyClosingDays: { type: [String], default: [] },
    defaultPrepTimeMinutes: { type: Number, default: 25 },
    deliveryFee: { type: Number, default: 40 },
    minOrderAmount: { type: Number, default: 150 },
    minOrderForFreeDelivery: { type: Number, default: 499 },
    taxRatePercentage: { type: Number, default: 5 }, // 5% GST
    deliveryRadiusKm: { type: Number, default: 10 },
    estimatedDeliveryTimeMinutes: { type: Number, default: 35 },
    currencySymbol: { type: String, default: '₹' },
    currencyCode: { type: String, default: 'INR' },

    isKitchenAcceptingOrders: { type: Boolean, default: true },
    isOnlineOrderingEnabled: { type: Boolean, default: true },
    isCodEnabled: { type: Boolean, default: true },
    isOnlinePaymentEnabled: { type: Boolean, default: true },
    isDeliveryEnabled: { type: Boolean, default: true },
    isPickupEnabled: { type: Boolean, default: true },

    instagramUrl: { type: String, default: 'https://instagram.com/cloudkitchenpro' },
    facebookUrl: { type: String, default: 'https://facebook.com/cloudkitchenpro' },
    twitterUrl: { type: String, default: 'https://twitter.com/cloudkitchenpro' },
  },
  { timestamps: true }
);

const RestaurantSettings: Model<IRestaurantSettings> =
  mongoose.models.RestaurantSettings ||
  mongoose.model<IRestaurantSettings>('RestaurantSettings', RestaurantSettingsSchema);

export default RestaurantSettings;
