import { dbConnect } from './db';
import Order from '@/models/Orders.models';
import Product from '@/models/Products.models';
import Payout from '@/models/Payouts.models';
import Review from '@/models/Reviews.models';

/**
 * Calculate date range based on period
 */
export function getDateRange(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return { startDate, endDate };
}

/**
 * Get seller dashboard metrics
 */
export async function getSellerDashboardMetrics(sellerId: string) {
  await dbConnect();

  // Total orders
  const totalOrders = await Order.countDocuments({ sellerId });

  // Total revenue
  const revenueData = await Order.aggregate([
    { $match: { sellerId, status: { $in: ['delivered', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const totalRevenue = revenueData[0]?.total || 0;

  // Active listings
  const activeListings = await Product.countDocuments({ sellerId, status: 'active' });

  // Pending orders
  const pendingOrders = await Order.countDocuments({ sellerId, status: 'pending' });

  // Low stock products
  const lowStockProducts = await Product.find({
    sellerId,
    status: 'active',
    $expr: { $lte: ['$stock', '$lowStockThreshold'] }
  })
  .select('_id name stock lowStockThreshold')
  .limit(10)
  .lean();

  // Average rating
  const products = await Product.find({ sellerId }).select('_id');
  const productIds = products.map(p => p._id);
  
  const ratingData = await Review.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);
  
  const averageRating = ratingData[0]?.avgRating || 0;
  const totalReviews = ratingData[0]?.totalReviews || 0;

  return {
    totalOrders,
    totalRevenue,
    activeListings,
    pendingOrders,
    lowStockProducts,
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews,
  };
}

/**
 * Get sales analytics for a period
 */
export async function getSalesAnalytics(sellerId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  await dbConnect();
  const { startDate, endDate } = getDateRange(period);

  const salesData = await Order.aggregate([
    {
      $match: {
        sellerId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['delivered', 'shipped', 'confirmed'] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return salesData.map(item => ({
    date: item._id,
    orders: item.orders,
    revenue: item.revenue,
  }));
}

/**
 * Get top-selling products
 */
export async function getTopSellingProducts(sellerId: string, limit = 10) {
  await dbConnect();

  const topProducts = await Product.find({ sellerId, status: 'active' })
    .sort({ orderCount: -1 })
    .limit(limit)
    .select('name sku price orderCount viewCount')
    .lean();

  return topProducts;
}

/**
 * Get product performance metrics
 */
export async function getProductPerformance(sellerId: string) {
  await dbConnect();

  const products = await Product.find({ sellerId, status: 'active' }).lean();

  const performance = products.map(product => ({
    id: product._id,
    name: product.name,
    sku: product.sku,
    views: product.viewCount || 0,
    orders: product.orderCount || 0,
    returns: product.returnCount || 0,
    conversionRate: product.viewCount > 0 
      ? ((product.orderCount / product.viewCount) * 100).toFixed(2) 
      : '0.00',
    returnRate: product.orderCount > 0 
      ? ((product.returnCount / product.orderCount) * 100).toFixed(2) 
      : '0.00',
  }));

  return performance;
}

/**
 * Get payout summary
 */
export async function getPayoutSummary(sellerId: string, period?: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  await dbConnect();

  const query: Record<string, unknown> = { sellerId };
  
  if (period) {
    const { startDate, endDate } = getDateRange(period);
    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const payoutData = await Payout.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalCommission: { $sum: '$platformCommission' },
        totalNetAmount: { $sum: '$netAmount' }
      }
    }
  ]);

  const summary = {
    pending: { count: 0, amount: 0, commission: 0, netAmount: 0 },
    processing: { count: 0, amount: 0, commission: 0, netAmount: 0 },
    completed: { count: 0, amount: 0, commission: 0, netAmount: 0 },
    failed: { count: 0, amount: 0, commission: 0, netAmount: 0 },
  };

  payoutData.forEach(item => {
    const status = item._id as keyof typeof summary;
    summary[status] = {
      count: item.count,
      amount: item.totalAmount,
      commission: item.totalCommission,
      netAmount: item.totalNetAmount,
    };
  });

  return summary;
}

/**
 * Get order status distribution
 */
export async function getOrderStatusDistribution(sellerId: string) {
  await dbConnect();

  const statusData = await Order.aggregate([
    { $match: { sellerId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return statusData.map(item => ({
    status: item._id,
    count: item.count,
  }));
}

/**
 * Calculate platform commission
 */
export function calculateCommission(amount: number, commissionRate = 0.10): number {
  return parseFloat((amount * commissionRate).toFixed(2));
}

/**
 * Get revenue trend
 */
export async function getRevenueTrend(sellerId: string, days = 30) {
  await dbConnect();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trendData = await Order.aggregate([
    {
      $match: {
        sellerId,
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'shipped', 'confirmed'] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return trendData.map(item => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders,
  }));
}
