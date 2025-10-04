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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
            Manage your products and track your sales
          </p>
          
          {extendedSession?.user?.originalRole && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 sm:mt-4">
              <p className="text-xs text-green-800 sm:text-sm">
                🎭 <strong>Role Simulation Active:</strong> You&apos;re viewing this as a seller. 
                Use the floating banner to return to admin panel.
              </p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 sm:h-12 sm:w-12">
                <Package className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Total Products</p>
              </div>
            </div>
          </div>

          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 sm:h-12 sm:w-12">
                <DollarSign className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">$0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Total Revenue</p>
              </div>
            </div>
          </div>

          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 sm:h-12 sm:w-12">
                <TrendingUp className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Orders</p>
              </div>
            </div>
          </div>

          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 sm:h-12 sm:w-12">
                <Eye className="h-5 w-5 text-orange-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Total Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:scale-105 hover:border-green-500 hover:shadow-md">
              <Plus className="h-6 w-6 text-green-600 sm:h-8 sm:w-8" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 sm:text-base">Add New Product</h3>
                <p className="text-xs text-gray-600 sm:text-sm">List a new item for sale</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:scale-105 hover:border-green-500 hover:shadow-md">
              <Package className="h-6 w-6 text-blue-600 sm:h-8 sm:w-8" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 sm:text-base">Manage Products</h3>
                <p className="text-xs text-gray-600 sm:text-sm">Edit your product listings</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:scale-105 hover:border-green-500 hover:shadow-md">
              <Store className="h-6 w-6 text-purple-600 sm:h-8 sm:w-8" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 sm:text-base">View Orders</h3>
                <p className="text-xs text-gray-600 sm:text-sm">Check pending orders</p>
              </div>
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Your Products</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="py-8 text-center sm:py-12">
              <Store className="mx-auto h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
              <h3 className="mt-3 text-base font-medium text-gray-900 sm:mt-4 sm:text-lg">No products yet</h3>
              <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                Start by adding your first product to sell on Deligo
              </p>
              <button className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700 hover:scale-105 sm:mt-6 sm:px-6 sm:text-base">
                Add Your First Product
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:mt-8 sm:p-6">
          <h3 className="text-base font-semibold text-blue-900 sm:text-lg">🎉 Welcome to Seller Dashboard!</h3>
          <p className="mt-2 text-xs text-blue-800 sm:text-sm">
            This is a placeholder seller dashboard. In a complete implementation, you would be able to:
          </p>
          <ul className="mt-3 space-y-1 text-xs text-blue-800 sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Add and manage products</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>View and process orders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Track sales and revenue</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Manage inventory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Communicate with customers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>View analytics and insights</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
