"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  Navigation,
} from "lucide-react";

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalDeliveries: number;
  completedDeliveries: number;
}

export default function DriverDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, earningsRes] = await Promise.all([
        fetch("/api/delivery/assignments"),
        fetch("/api/delivery/earnings"),
      ]);

      if (assignmentsRes.status === 404 || earningsRes.status === 404) {
        setError("No delivery profile found. Please apply to become a delivery partner.");
        setLoading(false);
        return;
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setStats(assignmentsData.data.stats);
      }

      if (earningsRes.ok) {
        const earningsData = await earningsRes.json();
        setEarnings(earningsData.data.summary);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <Package className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Delivery Profile
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href="/deliveryapplication"
              className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
            >
              Apply as Delivery Partner
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s your delivery dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.pending || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.inProgress || 0}
              </p>
            </div>
            <Navigation className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.completed || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total || 0}
              </p>
            </div>
            <Package className="h-8 w-8 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Earnings Summary</h2>
          <DollarSign className="h-8 w-8" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-green-100 text-sm">Total Earnings</p>
            <p className="text-2xl font-bold">
              ₹{earnings?.totalEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-2xl font-bold">
              ₹{earnings?.pendingEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Paid Out</p>
            <p className="text-2xl font-bold">
              ₹{earnings?.paidEarnings?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/driver/assignments"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Deliveries</h3>
              <p className="text-sm text-gray-600">Manage your assignments</p>
            </div>
          </div>
        </Link>

        <Link
          href="/driver/earnings"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Earnings</h3>
              <p className="text-sm text-gray-600">Track your income</p>
            </div>
          </div>
        </Link>

        <Link
          href="/driver/profile"
          className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profile</h3>
              <p className="text-sm text-gray-600">Update your details</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
