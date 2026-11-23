import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import DeliveryAssignment from '@/models/DeliveryAssignment';
import { getAuthUserFromRequest } from '@/lib/auth';
import { broadcastDeliveryLocation } from '@/lib/socket-emitter';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const auth = getAuthUserFromRequest(req);
    if (!auth || (auth.role !== 'delivery' && auth.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const assignment = await DeliveryAssignment.findById(params.id);
    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Assignment not found' }, { status: 404 });
    }

    const body = await req.json();
    const { lat, lng } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ success: false, error: 'Valid numeric lat and lng required' }, { status: 400 });
    }

    assignment.currentLocation = {
      lat,
      lng,
      updatedAt: new Date(),
    };

    await assignment.save();

    broadcastDeliveryLocation(assignment.orderId.toString(), { lat, lng });

    return NextResponse.json({
      success: true,
      currentLocation: assignment.currentLocation,
    });
  } catch (error: any) {
    console.error('Update location error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
  }
}
