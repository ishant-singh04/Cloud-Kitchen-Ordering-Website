import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Ingredient from '@/models/Ingredient';
import InventoryTransaction from '@/models/InventoryTransaction';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'kitchen')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectToDatabase();
    const ingredients = await Ingredient.find().sort({ name: 1 });

    const lowStockAlerts = ingredients.filter(
      (ing) => ing.currentStock <= ing.lowStockThreshold
    );

    return NextResponse.json({
      success: true,
      count: ingredients.length,
      ingredients,
      lowStockAlertsCount: lowStockAlerts.length,
      lowStockAlerts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin required' }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();

    const ingredient = await Ingredient.create({
      name: body.name.trim(),
      currentStock: Number(body.currentStock || 0),
      unit: body.unit || 'kg',
      lowStockThreshold: Number(body.lowStockThreshold || 5),
      costPerUnit: Number(body.costPerUnit || 0),
    });

    await InventoryTransaction.create({
      ingredientId: ingredient._id,
      ingredientName: ingredient.name,
      changeType: 'restock',
      quantity: ingredient.currentStock,
      previousStock: 0,
      newStock: ingredient.currentStock,
      unit: ingredient.unit,
      notes: 'Initial ingredient stock creation',
      performedBy: auth.name,
    });

    return NextResponse.json({ success: true, ingredient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create ingredient' }, { status: 500 });
  }
}
