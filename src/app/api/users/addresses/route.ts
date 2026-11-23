import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getAuthUserFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { label, street, city, state, pincode, landmark, isDefault } = body;

    if (!street || !city || !pincode) {
      return NextResponse.json({ success: false, error: 'Street, city and pincode are required' }, { status: 400 });
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      _id: new mongoose.Types.ObjectId() as any,
      label: label || 'Home',
      street,
      city,
      state: state || 'Karnataka',
      pincode,
      landmark: landmark || '',
      isDefault: isDefault ?? (user.addresses.length === 0),
    });

    await user.save();

    return NextResponse.json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to add address' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ success: false, error: 'Address ID required' }, { status: 400 });
    }

    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    user.addresses = user.addresses.filter((a: any) => a._id.toString() !== addressId);
    await user.save();

    return NextResponse.json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete address' }, { status: 500 });
  }
}
