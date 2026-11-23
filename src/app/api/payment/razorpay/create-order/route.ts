import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getAuthUserFromRequest } from '@/lib/auth';

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_cloudkitchen123';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_test_mock_cloudkitchen456';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, currency = 'INR', receipt } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid amount is required' }, { status: 400 });
    }

    const amountInPaise = Math.round(amount * 100);

    // If real keys are provided (not demo mock prefix), call actual Razorpay SDK
    if (keyId && !keyId.includes('mock') && keySecret && !keySecret.includes('mock')) {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const options = {
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      });
    }

    // Razorpay Development / Test mode fallback
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency,
      keyId,
      isTestMode: true,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create payment order' }, { status: 500 });
  }
}
