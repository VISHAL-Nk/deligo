// src/app/admin/statistics/page.tsx

"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, Users, DollarSign, Package } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import StatsCard from "@/components/admin/StatsCard";

interface Statistics {
  users: {
    total: number;
    customers: number;
    sellers: number;
    delivery: number;
  };
  orders: {
    total: number;
    delivered: number;
    pending: number;
  };
  revenue: {
    total: number;
    monthly: Array<{
      _id: { year: number; month: number };
      revenue: number;
      orders: number;
    }>;
  };
  products: {
    total: number;
    active: number;
  };
  topSellers: Array<{
    _id: string;
    totalSales: number;
    orderCount: number;
    businessName: string;
    email: string;
  }>;
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/statistics");
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Failed to load statistics</p>
      </div>
    );
  }

  // Prepare monthly revenue data for chart
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const revenueChartData = statistics.revenue.monthly.map((item) => ({
    month: monthNames[item._id.month - 1],
    revenue: item.revenue,
    orders: item.orders,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Statistics & Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive platform performance metrics
          </p>
        </div>
        <button
          onClick={fetchStatistics}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={statistics.users.total}
          icon={Users}
          description={`${statistics.users.customers} customers`}
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${statistics.revenue.total.toLocaleString()}`}
          icon={DollarSign}
          description="From delivered orders"
        />
        <StatsCard
          title="Total Orders"
          value={statistics.orders.total}
          icon={Package}
          description={`${statistics.orders.delivered} delivered`}
        />
        <StatsCard
          title="Active Products"
          value={statistics.products.active}
          icon={TrendingUp}
          description={`of ${statistics.products.total} total`}
        />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Revenue Trend (Last 6 Months)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#16a34a"
              strokeWidth={2}
              name="Revenue (₹)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Monthly Orders
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#16a34a" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Sellers */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Top Performing Sellers
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {statistics.topSellers.map((seller, index) => (
                <tr key={seller._id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {seller.businessName}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {seller.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-semibold text-green-600">
                      ₹{seller.totalSales.toLocaleString()}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {seller.orderCount} orders
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            User Distribution
          </h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Customers
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.users.customers}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{
                    width: `${(statistics.users.customers / statistics.users.total) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Sellers
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.users.sellers}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{
                    width: `${(statistics.users.sellers / statistics.users.total) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Delivery Partners
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.users.delivery}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-purple-600"
                  style={{
                    width: `${(statistics.users.delivery / statistics.users.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Order Status
          </h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Delivered
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.orders.delivered}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{
                    width: `${(statistics.orders.delivered / statistics.orders.total) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Pending
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.orders.pending}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-yellow-600"
                  style={{
                    width: `${(statistics.orders.pending / statistics.orders.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
