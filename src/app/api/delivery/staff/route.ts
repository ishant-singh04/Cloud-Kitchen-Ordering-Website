import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import DeliveryAssignment from '@/models/DeliveryAssignment';
import { getAuthUserFromRequest, hashPassword } from '@/lib/auth';
import { z } from 'zod';

const AddStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  vehicleType: z.enum(['Bike', 'Scooter', 'Electric Bike', 'Car']).default('Bike'),
  vehicleNumber: z.string().optional().default(''),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'kitchen')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const deliveryStaff = await User.find({ role: 'delivery' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with active assignment count
    const staffWithAssignments = await Promise.all(
      deliveryStaff.map(async (staff: any) => {
        const activeAssignment = await DeliveryAssignment.findOne({
          deliveryStaffId: staff._id,
          status: { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
        })
          .populate('orderId', 'orderNumber totalAmount status deliveryAddress')
          .lean();

        const completedCount = await DeliveryAssignment.countDocuments({
          deliveryStaffId: staff._id,
          status: 'DELIVERED',
        });

        return {
          ...staff,
          activeAssignment: activeAssignment || null,
          totalDeliveriesCompleted: completedCount,
        };
      })
    );

    return NextResponse.json({ success: true, staff: staffWithAssignments });
  } catch (error: any) {
    console.error('Fetch delivery staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch delivery staff' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = AddStaffSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: parseResult.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password, phone, vehicleType, vehicleNumber } = parseResult.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const newStaff = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      role: 'delivery',
      vehicleType,
      vehicleNumber: vehicleNumber || '',
      isAvailable: true,
      activeStatus: 'active',
      totalDeliveriesCompleted: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery staff member added successfully',
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        vehicleType: newStaff.vehicleType,
        vehicleNumber: newStaff.vehicleNumber,
        isAvailable: newStaff.isAvailable,
        activeStatus: newStaff.activeStatus,
      },
    });
  } catch (error: any) {
    console.error('Create delivery staff error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create delivery staff' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { staffId, isAvailable, activeStatus, vehicleType, vehicleNumber } = body;

    // Delivery staff can only toggle their own isAvailable
    // Admin can update any staff
    const targetId = auth.role === 'admin' ? (staffId || auth.userId) : auth.userId;

    const staff = await User.findOne({ _id: targetId, role: 'delivery' });
    if (!staff) {
      return NextResponse.json({ success: false, error: 'Delivery staff member not found' }, { status: 404 });
    }

    if (typeof isAvailable === 'boolean') staff.isAvailable = isAvailable;
    if (auth.role === 'admin' && activeStatus) staff.activeStatus = activeStatus;
    if (vehicleType) staff.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) staff.vehicleNumber = vehicleNumber;

    await staff.save();

    return NextResponse.json({
      success: true,
      message: 'Delivery staff status updated successfully',
      staff: {
        id: staff._id,
        name: staff.name,
        isAvailable: staff.isAvailable,
        activeStatus: staff.activeStatus,
        vehicleType: staff.vehicleType,
        vehicleNumber: staff.vehicleNumber,
      },
    });
  } catch (error: any) {
    console.error('Update delivery staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update delivery staff' }, { status: 500 });
  }
}
