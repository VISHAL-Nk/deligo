'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Star,
  Plus,
  Eye,
} from 'lucide-react';

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
  pendingOrders: number;
  lowStockProducts: Array<{
    _id: string;
    name: string;
    stock: number;
    lowStockThreshold: number;
  }>;
  averageRating: number;
}

export default function SellerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/seller/dashboard');
      const result = await response.json();

      if (result.success) {
        // Extract metrics from the nested structure
        const metrics = result.data.metrics || result.data;
        setData({
          totalOrders: metrics.totalOrders || 0,
          totalRevenue: metrics.totalRevenue || 0,
          activeListings: metrics.activeListings || 0,
          pendingOrders: metrics.pendingOrders || 0,
          lowStockProducts: metrics.lowStockProducts || [],
          averageRating: metrics.averageRating || 0,
        });
      } else {
        setError(result.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('An error occurred while loading dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Seller Profile Found</h2>
          <p className="text-gray-600">Please complete your seller registration first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here is your store overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-green-600">+12%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">₹{(data.totalRevenue || 0).toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-semibold text-blue-600">+8%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{data.totalOrders || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Products</h3>
          <p className="text-3xl font-bold text-gray-900">{data.activeListings || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm font-semibold text-yellow-600">+5%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Avg. Rating</h3>
          <p className="text-3xl font-bold text-gray-900">{(data.averageRating || 0).toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/seller/products/new"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <Plus className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">Add Product</span>
            </Link>
            <Link
              href="/seller/orders"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Eye className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">View Orders</span>
            </Link>
            <Link
              href="/seller/analytics"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">Analytics</span>
            </Link>
            <Link
              href="/seller/reviews"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <Star className="w-8 h-8 text-yellow-600 mb-2" />
              <span className="text-sm font-semibold text-gray-700">Reviews</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Low Stock Alerts</h2>
            {(data.lowStockProducts || []).length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                {data.lowStockProducts.length}
              </span>
            )}
          </div>
          
          {(data.lowStockProducts || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data.lowStockProducts || []).slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        Only {product.stock} left (threshold: {product.lowStockThreshold})
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/seller/products/${product._id}`}
                    className="text-sm font-semibold text-green-600 hover:text-green-700"
                  >
                    Restock
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(data.pendingOrders || 0) > 0 && (
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">You have {data.pendingOrders} pending orders</h3>
                <p className="text-sm text-blue-700">Review and process them to keep customers happy</p>
              </div>
            </div>
            <Link
              href="/seller/orders"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
