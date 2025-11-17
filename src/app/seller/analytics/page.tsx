'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
  pendingOrders: number;
  averageRating: number;
}

interface SalesData {
  totalSales: number;
  netRevenue: number;
  platformCommission: number;
  orderCount: number;
  averageOrderValue: number;
}

interface TopProduct {
  _id: string;
  name: string;
  totalSales: number;
  revenue: number;
  orderCount: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all analytics data
      const [metricsRes, salesRes, productsRes] = await Promise.all([
        fetch('/api/seller/dashboard'),
        fetch(`/api/seller/analytics/sales?days=${dateRange}`),
        fetch(`/api/seller/analytics/top-products?limit=5`),
      ]);

      // Check if responses are ok before parsing JSON
      const parseJSON = async (response: Response, defaultValue: unknown = null) => {
        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          return { success: false, data: defaultValue };
        }
        try {
          return await response.json();
        } catch (error) {
          console.error('JSON parse error:', error);
          return { success: false, data: defaultValue };
        }
      };

      const [metricsData, salesData, productsData] = await Promise.all([
        parseJSON(metricsRes, null),
        parseJSON(salesRes, null),
        parseJSON(productsRes, []),
      ]);

      if (metricsData.success) {
        const data = metricsData.data?.metrics || metricsData.data;
        setMetrics({
          totalOrders: data?.totalOrders || 0,
          totalRevenue: data?.totalRevenue || 0,
          activeListings: data?.activeListings || 0,
          pendingOrders: data?.pendingOrders || 0,
          averageRating: data?.averageRating || 0,
        });
      }
      if (salesData.success) setSalesData(salesData.data || null);
      if (productsData.success) setTopProducts(productsData.products || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setMetrics(null);
      setSalesData(null);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">Track your business performance</p>
            </div>
            <div className="flex gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center text-green-600 text-sm font-semibold">
                <ArrowUp className="w-4 h-4 mr-1" />
                12%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">
              ₹{(salesData?.totalSales || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Net: ₹{(salesData?.netRevenue || 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center text-green-600 text-sm font-semibold">
                <ArrowUp className="w-4 h-4 mr-1" />
                8%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{salesData?.orderCount || 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: ₹{(salesData?.averageOrderValue || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center text-red-600 text-sm font-semibold">
                <ArrowDown className="w-4 h-4 mr-1" />
                3%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Products</h3>
            <p className="text-3xl font-bold text-gray-900">{metrics?.activeListings || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Listed on marketplace</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex items-center text-green-600 text-sm font-semibold">
                <ArrowUp className="w-4 h-4 mr-1" />
                15%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Avg. Rating</h3>
            <p className="text-3xl font-bold text-gray-900">
              {(metrics?.averageRating || 0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Out of 5.0</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Gross Sales</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{(salesData?.totalSales || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Platform Commission (10%)</p>
              <p className="text-2xl font-bold text-yellow-600">
                -₹{(salesData?.platformCommission || 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Net Earnings</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{(salesData?.netRevenue || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Selling Products</h2>
          {(topProducts || []).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No sales data available yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Orders</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Units Sold</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(topProducts || []).map((product, index) => (
                    <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900">{product.name}</p>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">{product.orderCount || 0}</td>
                      <td className="py-4 px-4 text-right text-gray-700">{product.totalSales || 0}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-green-600">
                          ₹{(product.revenue || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
