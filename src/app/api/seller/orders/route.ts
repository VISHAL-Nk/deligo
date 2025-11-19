import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Orders.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - List all orders for seller
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { sellerId: sellerProfile._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name email')
        .populate('items.productId', 'name images sku price discount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
