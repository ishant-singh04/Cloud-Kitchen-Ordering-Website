import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import DeliveryAssignment from '@/models/DeliveryAssignment';
import { getAuthUserFromRequest } from '@/lib/auth';
import { broadcastDeliveryStatusChange, broadcastOrderStatusChange } from '@/lib/socket-emitter';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const assignment = await DeliveryAssignment.findById(params.id);
    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Delivery assignment not found' }, { status: 404 });
    }

    // Role check: Delivery staff can only update their own assignment; Admin can manage any
    if (auth.role === 'delivery' && assignment.deliveryStaffId.toString() !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized to modify this delivery assignment' }, { status: 403 });
    }

    const body = await req.json();
    const { status, otp, failureReason, notes } = body;

    const order = await Order.findById(assignment.orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Associated order not found' }, { status: 404 });
    }

    const previousStatus = assignment.status;

    if (status === 'ACCEPTED') {
      assignment.status = 'ACCEPTED';
      assignment.acceptedAt = new Date();
      if (notes) assignment.notes = notes;

      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Delivery assignment accepted by rider ${assignment.deliveryStaffName}`,
        updatedBy: `${auth.name} (${auth.role})`,
      });
    } else if (status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY') {
      assignment.status = status;
      if (!assignment.pickedUpAt) assignment.pickedUpAt = new Date();
      if (notes) assignment.notes = notes;

      // Update Order status to OUT_FOR_DELIVERY
      order.status = 'OUT_FOR_DELIVERY';
      order.pickedUpAt = assignment.pickedUpAt;
      order.statusHistory.push({
        status: 'OUT_FOR_DELIVERY',
        timestamp: new Date(),
        note: `Order picked up and is out for delivery with ${assignment.deliveryStaffName}`,
        updatedBy: `${auth.name} (${auth.role})`,
      });
    } else if (status === 'DELIVERED') {
      // Secure OTP verification
      const trimmedOtp = (otp || '').toString().trim();
      const expectedOtp = (assignment.deliveryOtp || order.deliveryOtp || '').toString().trim();

      const isAdminBypass = auth.role === 'admin';

      if (!isAdminBypass && (!trimmedOtp || trimmedOtp !== expectedOtp)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid Delivery OTP! Please request the correct 4-digit OTP from the customer.',
          },
          { status: 400 }
        );
      }

      assignment.status = 'DELIVERED';
      assignment.otpVerified = true;
      assignment.deliveredAt = new Date();
      if (notes) assignment.notes = notes;

      order.status = 'DELIVERED';
      order.deliveredAt = new Date();

      // If Cash on delivery, mark payment completed
      if (order.paymentMethod === 'cod') {
        order.paymentStatus = 'completed';
      }

      order.statusHistory.push({
        status: 'DELIVERED',
        timestamp: new Date(),
        note: isAdminBypass
          ? `Delivery completed (Verified by Admin override)`
          : `Delivered successfully to customer (OTP verified: ${expectedOtp})`,
        updatedBy: `${auth.name} (${auth.role})`,
      });

      // Update rider metrics & free availability
      await User.findByIdAndUpdate(assignment.deliveryStaffId, {
        isAvailable: true,
        $inc: { totalDeliveriesCompleted: 1 },
      });
    } else if (status === 'DELIVERY_FAILED') {
      if (!failureReason) {
        return NextResponse.json(
          { success: false, error: 'A specific reason is required for reporting delivery failure' },
          { status: 400 }
        );
      }

      assignment.status = 'DELIVERY_FAILED';
      assignment.failedAt = new Date();
      assignment.failureReason = failureReason;

      order.status = 'DELIVERY_FAILED';
      order.failureReason = failureReason;

      order.statusHistory.push({
        status: 'DELIVERY_FAILED',
        timestamp: new Date(),
        note: `Delivery attempt failed: ${failureReason}`,
        updatedBy: `${auth.name} (${auth.role})`,
      });

      // Free rider availability
      await User.findByIdAndUpdate(assignment.deliveryStaffId, {
        isAvailable: true,
      });
    } else if (status === 'REASSIGNMENT_REQUIRED') {
      assignment.status = 'REASSIGNMENT_REQUIRED';
      assignment.notes = notes || 'Reassignment requested';

      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Order unassigned for reassignment`,
        updatedBy: `${auth.name} (${auth.role})`,
      });

      // Clear delivery details from order
      order.deliveryStaffId = undefined as any;
      order.deliveryStaffName = undefined as any;
      order.deliveryStaffPhone = undefined as any;
    } else {
      return NextResponse.json({ success: false, error: `Invalid transition to status: ${status}` }, { status: 400 });
    }

    await assignment.save();
    await order.save();

    // Broadcast real-time updates
    broadcastDeliveryStatusChange(assignment, order);
    broadcastOrderStatusChange(order);

    return NextResponse.json({
      success: true,
      message: `Assignment status updated to ${assignment.status}`,
      assignment,
      order,
    });
  } catch (error: any) {
    console.error('Update assignment status error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update assignment status' }, { status: 500 });
  }
}
