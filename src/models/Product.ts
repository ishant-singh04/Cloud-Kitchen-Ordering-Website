import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddOn {
  _id?: string;
  name: string;
  price: number;
}

export interface IProductIngredient {
  ingredientId: mongoose.Types.ObjectId;
  quantityRequired: number; // in ingredient's base unit
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: mongoose.Types.ObjectId;
  image: string;
  isVeg: boolean;
  isBestseller: boolean;
  isAvailable: boolean;
  inStock: boolean;
  stockCount: number;
  prepTimeMinutes: number;
  calories?: number;
  addOns: IAddOn[];
  ingredientsNeeded: IProductIngredient[];
  rating: number;
  numReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddOnSchema = new Schema<IAddOn>({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
});

const ProductIngredientSchema = new Schema<IProductIngredient>({
  ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantityRequired: { type: Number, required: true, min: 0 },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, required: true },
    isVeg: { type: Boolean, default: true },
    isBestseller: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 999 },
    prepTimeMinutes: { type: Number, default: 20 },
    calories: { type: Number },
    addOns: [AddOnSchema],
    ingredientsNeeded: [ProductIngredientSchema],
    rating: { type: Number, default: 4.8 },
    numReviews: { type: Number, default: 12 },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
