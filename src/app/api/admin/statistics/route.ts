// src/app/api/admin/statistics/route.ts

import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import Order from "@/models/Orders.models";
import Product from "@/models/Products.models";
import SellerProfile from "@/models/SellerProfiles.models";
import { Session } from "@/lib/Session";

export async function GET() {
  try {
    // Check if user is authenticated and is admin
    const session = await Session();

    // Check if user is admin
    const isAdmin = session?.user?.role === "admin";

    if (!session || !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalSellers = await User.countDocuments({ role: "seller" });
    const totalDelivery = await User.countDocuments({ role: "delivery" });

    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: "delivered" });
    const pendingOrders = await Order.countDocuments({ status: { $in: ["pending", "processing"] } });

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Get monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { 
        $match: { 
          status: "delivered",
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Get top sellers
    const topSellers = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: "$sellerId", totalSales: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    // Populate seller details
    interface PopulatedSellerProfile {
      businessName?: string;
      userId?: {
        email?: string;
      };
    }

    const topSellersWithDetails = await Promise.all(
      topSellers.map(async (seller) => {
        const sellerProfile = await SellerProfile.findOne({ userId: seller._id }).populate("userId", "email").lean() as PopulatedSellerProfile | null;
        return {
          ...seller,
          businessName: sellerProfile?.businessName || "Unknown",
          email: sellerProfile?.userId?.email || "N/A",
        };
      })
    );

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    return NextResponse.json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          sellers: totalSellers,
          delivery: totalDelivery,
        },
        orders: {
          total: totalOrders,
          delivered: deliveredOrders,
          pending: pendingOrders,
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        topSellers: topSellersWithDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
