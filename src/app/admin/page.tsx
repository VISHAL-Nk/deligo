// src/app/admin/page.tsx

import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import Order from "@/models/Orders.models";
import Product from "@/models/Products.models";
import StatsCard from "@/components/admin/StatsCard";
import {
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

async function getStatistics() {
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();

  // Calculate total revenue
  const revenueData = await Order.aggregate([
    { $match: { status: "delivered" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  // Get pending orders
  const pendingOrders = await Order.countDocuments({
    status: { $in: ["pending", "processing"] },
  });

  // Get delivered orders
  const deliveredOrders = await Order.countDocuments({ status: "delivered" });

  return {
    totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue,
    pendingOrders,
    deliveredOrders,
  };
}

export default async function AdminDashboard() {
  const stats = await getStatistics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the Deligo Admin Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered users on platform"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          description="All time orders"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="From delivered orders"
        />
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="Listed products"
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={ShoppingCart}
          description="Awaiting processing"
        />
        <StatsCard
          title="Delivered Orders"
          value={stats.deliveredOrders}
          icon={TrendingUp}
          description="Successfully delivered"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/admin/users"
            className="rounded-lg border border-gray-300 bg-white p-4 text-center transition-all hover:border-green-600 hover:shadow-md"
          >
            <Users className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 font-medium text-gray-900">Manage Users</p>
          </a>
          <a
            href="/admin/sellers"
            className="rounded-lg border border-gray-300 bg-white p-4 text-center transition-all hover:border-green-600 hover:shadow-md"
          >
            <ShoppingBag className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 font-medium text-gray-900">Manage Sellers</p>
          </a>
          <a
            href="/admin/delivery"
            className="rounded-lg border border-gray-300 bg-white p-4 text-center transition-all hover:border-green-600 hover:shadow-md"
          >
            <Package className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 font-medium text-gray-900">Delivery Partners</p>
          </a>
          <a
            href="/admin/statistics"
            className="rounded-lg border border-gray-300 bg-white p-4 text-center transition-all hover:border-green-600 hover:shadow-md"
          >
            <TrendingUp className="mx-auto h-8 w-8 text-green-600" />
            <p className="mt-2 font-medium text-gray-900">View Analytics</p>
          </a>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
