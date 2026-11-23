import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventoryTransaction extends Document {
  ingredientId: mongoose.Types.ObjectId;
  ingredientName: string;
  changeType: 'deduction' | 'restock' | 'adjustment';
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  unit: string;
  orderId?: mongoose.Types.ObjectId;
  notes?: string;
  performedBy?: string;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    ingredientName: { type: String, required: true },
    changeType: {
      type: String,
      enum: ['deduction', 'restock', 'adjustment'],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    unit: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    notes: { type: String },
    performedBy: { type: String, default: 'System' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.models.InventoryTransaction ||
  mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);

export default InventoryTransaction;
