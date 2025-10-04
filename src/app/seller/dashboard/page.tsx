// src/app/seller/dashboard/page.tsx

"use client";

import { useSession } from "next-auth/react";
import { Store, Package, DollarSign, TrendingUp, Eye, Plus } from "lucide-react";
import type { Session } from "next-auth";

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    role: "customer" | "seller" | "delivery" | "support" | "admin";
    isVerified: boolean;
    hasProfile: boolean;
    name: string | null;
    image?: string | null;
    originalRole?: string;
  };
}

export default function SellerDashboardPage() {
  const { data: session } = useSession();
  const extendedSession = session as ExtendedSession | null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your products and track your sales
          </p>
          
          {extendedSession?.user?.originalRole && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">
                🎭 <strong>Role Simulation Active:</strong> You&apos;re viewing this as a seller. 
                Use the floating banner to return to admin panel.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">$0</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Orders</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500 hover:shadow-md">
              <Plus className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Add New Product</h3>
                <p className="text-sm text-gray-600">List a new item for sale</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500 hover:shadow-md">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Manage Products</h3>
                <p className="text-sm text-gray-600">Edit your product listings</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500 hover:shadow-md">
              <Store className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-600">Check pending orders</p>
              </div>
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No products yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Start by adding your first product to sell on Deligo
              </p>
              <button className="mt-6 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700">
                Add Your First Product
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">🎉 Welcome to Seller Dashboard!</h3>
          <p className="mt-2 text-sm text-blue-800">
            This is a placeholder seller dashboard. In a complete implementation, you would be able to:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-800">
            <li>✅ Add and manage products</li>
            <li>✅ View and process orders</li>
            <li>✅ Track sales and revenue</li>
            <li>✅ Manage inventory</li>
            <li>✅ Communicate with customers</li>
            <li>✅ View analytics and insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
