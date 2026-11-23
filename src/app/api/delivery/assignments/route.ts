import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import DeliveryAssignment from '@/models/DeliveryAssignment';
import { getAuthUserFromRequest } from '@/lib/auth';
import { broadcastDeliveryAssigned, broadcastOrderStatusChange } from '@/lib/socket-emitter';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const filter: any = {};

    if (auth.role === 'delivery') {
      // Delivery staff ONLY gets assignments assigned to them
      filter.deliveryStaffId = auth.userId;
      if (status) {
        filter.status = status;
      }
    } else if (auth.role === 'admin' || auth.role === 'kitchen') {
      if (status) {
        filter.status = status;
      }
      const staffId = searchParams.get('staffId');
      if (staffId) {
        filter.deliveryStaffId = staffId;
      }
    } else {
      return NextResponse.json({ success: false, error: 'Access forbidden' }, { status: 403 });
    }

    const assignments = await DeliveryAssignment.find(filter)
      .populate('orderId')
      .populate('deliveryStaffId', 'name phone vehicleType vehicleNumber isAvailable')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, count: assignments.length, assignments });
  } catch (error: any) {
    console.error('Fetch assignments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth || (auth.role !== 'admin' && auth.role !== 'kitchen')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin or Kitchen staff required' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, deliveryStaffId, notes } = body;

    if (!orderId || !deliveryStaffId) {
      return NextResponse.json(
        { success: false, error: 'orderId and deliveryStaffId are required' },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Check staff exists and is active
    const staff = await User.findOne({ _id: deliveryStaffId, role: 'delivery' });
    if (!staff) {
      return NextResponse.json({ success: false, error: 'Delivery staff member not found' }, { status: 404 });
    }

    if (staff.activeStatus === 'inactive') {
      return NextResponse.json(
        { success: false, error: 'Cannot assign to an inactive delivery partner' },
        { status: 400 }
      );
    }

    // Check if order already has an active assignment
    const existingActive = await DeliveryAssignment.findOne({
      orderId: order._id,
      status: { $in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'] },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          success: false,
          error: `Order already assigned to ${existingActive.deliveryStaffName}. Reassign or resolve existing assignment first.`,
        },
        { status: 400 }
      );
    }

    // Generate 4-digit Delivery OTP if order doesn't have one
    if (!order.deliveryOtp) {
      order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Create assignment
    const assignment = await DeliveryAssignment.create({
      orderId: order._id,
      deliveryStaffId: staff._id,
      deliveryStaffName: staff.name,
      deliveryStaffPhone: staff.phone,
      status: 'ASSIGNED',
      deliveryOtp: order.deliveryOtp,
      otpVerified: false,
      assignedAt: new Date(),
      notes: notes || '',
    });

    // Update order with rider details
    order.deliveryStaffId = staff._id;
    order.deliveryStaffName = staff.name;
    order.deliveryStaffPhone = staff.phone;
    order.assignedAt = new Date();

    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Delivery assigned to ${staff.name} (${staff.phone})`,
      updatedBy: `${auth.name} (${auth.role})`,
    });

    await order.save();

    // Broadcast assignment
    broadcastDeliveryAssigned(assignment, order);
    broadcastOrderStatusChange(order);

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} assigned to ${staff.name}`,
      assignment,
      order,
    });
  } catch (error: any) {
    console.error('Assign delivery error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to assign delivery' }, { status: 500 });
  }
}
