// src/app/delivery/dashboard/page.tsx

"use client";

import { Truck, Package, CheckCircle, Clock, MapPin, Navigation } from "lucide-react";

export default function DeliveryDashboardPage() {

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Delivery Partner Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
            Manage your deliveries and track your earnings
          </p>
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
                <p className="text-xs text-gray-600 sm:text-sm">Pending Deliveries</p>
              </div>
            </div>
          </div>

          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 sm:h-12 sm:w-12">
                <CheckCircle className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Completed Today</p>
              </div>
            </div>
          </div>

          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 sm:h-12 sm:w-12">
                <Truck className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Total Deliveries</p>
              </div>
            </div>
          </div>

          <div className="transform rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 sm:h-12 sm:w-12">
                <span className="text-lg font-bold text-orange-600 sm:text-xl">$</span>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 sm:text-2xl">$0</p>
                <p className="text-xs text-gray-600 sm:text-sm">Earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 sm:mb-4 sm:text-xl">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:scale-105 hover:border-green-500 hover:shadow-md">
              <MapPin className="h-6 w-6 text-green-600 sm:h-8 sm:w-8" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 sm:text-base">View Map</h3>
                <p className="text-xs text-gray-600 sm:text-sm">See delivery locations</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:scale-105 hover:border-green-500 hover:shadow-md">
              <Navigation className="h-6 w-6 text-blue-600 sm:h-8 sm:w-8" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 sm:text-base">Start Route</h3>
                <p className="text-xs text-gray-600 sm:text-sm">Begin delivery route</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:scale-105 hover:border-green-500 hover:shadow-md">
              <Clock className="h-6 w-6 text-purple-600 sm:h-8 sm:w-8" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 sm:text-base">View History</h3>
                <p className="text-xs text-gray-600 sm:text-sm">Check past deliveries</p>
              </div>
            </button>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Assigned Deliveries</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="py-8 text-center sm:py-12">
              <Truck className="mx-auto h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
              <h3 className="mt-3 text-base font-medium text-gray-900 sm:mt-4 sm:text-lg">No deliveries assigned</h3>
              <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                Check back later for new delivery assignments
              </p>
              <button className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-green-700 sm:mt-6 sm:px-6 sm:text-base">
                Refresh Assignments
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 sm:mt-8 sm:p-6">
          <h3 className="text-base font-semibold text-blue-900 sm:text-lg">🚚 Welcome to Delivery Partner Dashboard!</h3>
          <p className="mt-2 text-xs text-blue-800 sm:text-sm">
            This is a placeholder delivery dashboard. In a complete implementation, you would be able to:
          </p>
          <ul className="mt-3 space-y-1 text-xs text-blue-800 sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>View assigned deliveries</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Update delivery status (picked up, in transit, delivered)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Navigate to delivery locations with GPS</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Track earnings and completed deliveries</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>Communicate with customers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">✅</span>
              <span>View delivery history and performance metrics</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
