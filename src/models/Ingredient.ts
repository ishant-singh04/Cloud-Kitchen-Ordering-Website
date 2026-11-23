import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIngredient extends Document {
  name: string;
  currentStock: number;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs';
  lowStockThreshold: number;
  costPerUnit: number;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    unit: {
      type: String,
      enum: ['kg', 'g', 'l', 'ml', 'pcs'],
      required: true,
      default: 'kg',
    },
    lowStockThreshold: { type: Number, required: true, default: 5 },
    costPerUnit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Ingredient: Model<IIngredient> =
  mongoose.models.Ingredient || mongoose.model<IIngredient>('Ingredient', IngredientSchema);

export default Ingredient;
