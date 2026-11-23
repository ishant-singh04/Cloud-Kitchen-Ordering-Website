import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authPayload = getAuthUserFromRequest(req);
    if (!authPayload) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 200 }
      );
    }

    await connectToDatabase();
    const user = await User.findById(authPayload.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses || [],
        favorites: user.favorites || [],
        vehicleType: user.vehicleType,
        vehicleNumber: user.vehicleNumber,
        isAvailable: user.isAvailable,
        activeStatus: user.activeStatus,
        totalDeliveriesCompleted: user.totalDeliveriesCompleted || 0,
      },
    });
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
