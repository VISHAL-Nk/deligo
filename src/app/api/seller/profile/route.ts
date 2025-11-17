import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - Get seller profile
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: sellerProfile,
    });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update seller profile
export async function PATCH(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const updates = await req.json();

    // Update allowed fields
    const allowedUpdates = [
      'businessName',
      'gstNumber',
      'panNumber',
      'bankDetails',
      'store',
      'storefront',
      'maintenanceMode',
    ];

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sellerProfile as any)[key] = updates[key];
      }
    });

    await sellerProfile.save();

    return NextResponse.json({
      success: true,
      data: sellerProfile,
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    return NextResponse.json(
      { error: 'Failed to update seller profile' },
      { status: 500 }
    );
  }
}
