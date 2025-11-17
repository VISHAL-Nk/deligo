import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import { getSellerDashboardMetrics } from '@/lib/analytics';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get seller profile
    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Get dashboard metrics
    const metrics = await getSellerDashboardMetrics(sellerProfile._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        seller: {
          id: sellerProfile._id,
          businessName: sellerProfile.businessName,
          rating: sellerProfile.rating,
          kycStatus: sellerProfile.kycStatus,
          maintenanceMode: sellerProfile.maintenanceMode,
        },
        metrics,
      },
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
