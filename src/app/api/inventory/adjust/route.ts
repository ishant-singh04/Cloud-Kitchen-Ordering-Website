import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Ingredient from '@/models/Ingredient';
import InventoryTransaction from '@/models/InventoryTransaction';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin required' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { ingredientId, changeType, quantity, notes } = body;

    const ingredient = await Ingredient.findById(ingredientId);
    if (!ingredient) {
      return NextResponse.json({ success: false, error: 'Ingredient not found' }, { status: 404 });
    }

    const prevStock = ingredient.currentStock;
    let newStock = prevStock;

    if (changeType === 'restock') {
      newStock = prevStock + Math.abs(Number(quantity));
    } else if (changeType === 'deduction') {
      newStock = Math.max(0, prevStock - Math.abs(Number(quantity)));
    } else if (changeType === 'adjustment') {
      newStock = Math.max(0, Number(quantity));
    }

    newStock = Math.round(newStock * 100) / 100;
    const diff = newStock - prevStock;
    ingredient.currentStock = newStock;
    await ingredient.save();

    const transaction = await InventoryTransaction.create({
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      changeType: changeType || 'adjustment',
      quantity: diff,
      previousStock: prevStock,
      newStock: newStock,
      unit: ingredient.unit,
      notes: notes || `Manual stock adjustment (${changeType})`,
      performedBy: auth.name,
    });

    return NextResponse.json({
      success: true,
      ingredient,
      transaction,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to adjust stock' }, { status: 500 });
  }
}
