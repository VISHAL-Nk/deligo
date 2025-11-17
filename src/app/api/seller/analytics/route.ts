import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import { authOptions } from '../../auth/[...nextauth]/route';
import {
  getSalesAnalytics,
  getTopSellingProducts,
  getProductPerformance,
  getPayoutSummary,
  getOrderStatusDistribution,
  getRevenueTrend,
} from '@/lib/analytics';

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
    const type = searchParams.get('type');
    const period = (searchParams.get('period') || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'yearly';
    const sellerId = sellerProfile._id.toString();

    switch (type) {
      case 'sales':
        const salesData = await getSalesAnalytics(sellerId, period);
        return NextResponse.json({ success: true, data: salesData });

      case 'top-products':
        const topProducts = await getTopSellingProducts(sellerId, 10);
        return NextResponse.json({ success: true, data: topProducts });

      case 'product-performance':
        const performance = await getProductPerformance(sellerId);
        return NextResponse.json({ success: true, data: performance });

      case 'payouts':
        const payoutSummary = await getPayoutSummary(sellerId, period);
        return NextResponse.json({ success: true, data: payoutSummary });

      case 'order-status':
        const orderStatus = await getOrderStatusDistribution(sellerId);
        return NextResponse.json({ success: true, data: orderStatus });

      case 'revenue-trend':
        const days = parseInt(searchParams.get('days') || '30');
        const revenueTrend = await getRevenueTrend(sellerId, days);
        return NextResponse.json({ success: true, data: revenueTrend });

      default:
        // Return all analytics
        const [sales, topProds, perf, payouts, orderStat, revenue] = await Promise.all([
          getSalesAnalytics(sellerId, period),
          getTopSellingProducts(sellerId, 5),
          getProductPerformance(sellerId),
          getPayoutSummary(sellerId),
          getOrderStatusDistribution(sellerId),
          getRevenueTrend(sellerId, 30),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            sales,
            topProducts: topProds,
            productPerformance: perf,
            payouts,
            orderStatus: orderStat,
            revenueTrend: revenue,
          },
        });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
