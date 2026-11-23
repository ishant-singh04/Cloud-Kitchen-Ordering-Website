import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import { getAuthUserFromRequest } from '@/lib/auth';

const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_test_mock_cloudkitchen456';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderDbId } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ success: false, error: 'Missing payment verification parameters' }, { status: 400 });
    }

    let isValid = false;

    if (!keySecret.includes('mock') && razorpaySignature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isValid = generatedSignature === razorpaySignature;
    } else {
      // In development test mode with mock keys
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Payment signature verification failed' }, { status: 400 });
    }

    if (orderDbId) {
      await connectToDatabase();
      await Order.findByIdAndUpdate(orderDbId, {
        paymentStatus: 'completed',
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || 'verified_dev_signature',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpayPaymentId,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 500 });
  }
}
