import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Coupon from '@/models/Coupon';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const filter: any = {};
    if (activeOnly) {
      filter.isActive = true;
      filter.expiryDate = { $gte: new Date() };
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch coupons' }, { status: 500 });
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

    const coupon = await Coupon.create({
      code: body.code.toUpperCase().trim(),
      description: body.description,
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      minOrderAmount: Number(body.minOrderAmount || 0),
      maxDiscountAmount: Number(body.maxDiscountAmount || 500),
      expiryDate: new Date(body.expiryDate),
      totalUsageLimit: Number(body.totalUsageLimit || 1000),
      perCustomerLimit: Number(body.perCustomerLimit || 1),
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}
