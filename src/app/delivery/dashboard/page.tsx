// src/app/delivery/dashboard/page.tsx

"use client";

import { useSession } from "next-auth/react";
import { Truck, Package, CheckCircle, Clock, MapPin, Navigation } from "lucide-react";
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

export default function DeliveryDashboardPage() {
  const { data: session } = useSession();
  const extendedSession = session as ExtendedSession | null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Partner Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your deliveries and track your earnings
          </p>
          
          {extendedSession?.user?.originalRole && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">
                🎭 <strong>Role Simulation Active:</strong> You&apos;re viewing this as a delivery partner. 
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
                <p className="text-sm text-gray-600">Pending Deliveries</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Completed Today</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Total Deliveries</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <span className="text-xl font-bold text-orange-600">$</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">$0</p>
                <p className="text-sm text-gray-600">Earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500 hover:shadow-md">
              <MapPin className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">View Map</h3>
                <p className="text-sm text-gray-600">See delivery locations</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500 hover:shadow-md">
              <Navigation className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Start Route</h3>
                <p className="text-sm text-gray-600">Begin delivery route</p>
              </div>
            </button>

            <button className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-green-500 hover:shadow-md">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">View History</h3>
                <p className="text-sm text-gray-600">Check past deliveries</p>
              </div>
            </button>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Deliveries</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No deliveries assigned</h3>
              <p className="mt-2 text-sm text-gray-600">
                Check back later for new delivery assignments
              </p>
              <button className="mt-6 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700">
                Refresh Assignments
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">🚚 Welcome to Delivery Partner Dashboard!</h3>
          <p className="mt-2 text-sm text-blue-800">
            This is a placeholder delivery dashboard. In a complete implementation, you would be able to:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-800">
            <li>✅ View assigned deliveries</li>
            <li>✅ Update delivery status (picked up, in transit, delivered)</li>
            <li>✅ Navigate to delivery locations with GPS</li>
            <li>✅ Track earnings and completed deliveries</li>
            <li>✅ Communicate with customers</li>
            <li>✅ View delivery history and performance metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
