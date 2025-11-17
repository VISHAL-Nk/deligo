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
  Power,
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [isOnline, setIsOnline] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, earningsRes, availabilityRes] = await Promise.all([
        fetch("/api/delivery/assignments"),
        fetch("/api/delivery/earnings"),
        fetch("/api/delivery/availability"),
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

      if (availabilityRes.ok) {
        const availabilityData = await availabilityRes.json();
        setIsOnline(availabilityData.isOnline || false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    setTogglingStatus(true);
    try {
      const res = await fetch("/api/delivery/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: !isOnline }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsOnline(data.isOnline);
        toast.success(data.message, { duration: 3000 });
      } else {
        toast.error(data.error || "Failed to update status", { duration: 4000 });
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update online status", { duration: 4000 });
    } finally {
      setTogglingStatus(false);
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile-First Header with Status Toggle */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">
              {session?.user?.name || "Driver"}
            </h1>
            <p className="text-green-100 text-sm">Delivery Dashboard</p>
          </div>
          <Link href="/driver/profile" className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">
            <MapPin className="h-5 w-5" />
          </Link>
        </div>

        {/* Online/Offline Toggle - Prominent */}
        <button
          onClick={toggleOnlineStatus}
          disabled={togglingStatus}
          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg ${
            isOnline
              ? "bg-white text-green-600 hover:bg-green-50"
              : "bg-red-500 text-white hover:bg-red-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Power className={`h-5 w-5 ${togglingStatus ? "animate-spin" : ""}`} />
          <span className="text-lg">
            {togglingStatus ? "Updating..." : isOnline ? "YOU ARE ONLINE" : "YOU ARE OFFLINE"}
          </span>
        </button>
        
        {!isOnline && (
          <p className="text-center text-green-100 text-xs mt-2">
            Tap to go online and start receiving deliveries
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-1">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">
                {stats?.pending || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Pending</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-1">
              <Navigation className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {stats?.inProgress || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">In Progress</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {stats?.completed || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Completed</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-gray-500">
            <div className="flex items-center justify-between mb-1">
              <Package className="h-5 w-5 text-gray-900" />
              <span className="text-2xl font-bold text-gray-900">
                {stats?.total || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">Total</p>
          </div>
        </div>

        {/* Earnings Card - Mobile Optimized */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Today's Earnings</h2>
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-100 text-sm">Total Earned</span>
              <span className="text-2xl font-bold">
                ₹{earnings?.totalEarnings?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-green-500 pt-2">
              <span className="text-green-100 text-xs">Pending</span>
              <span className="text-lg font-semibold">
                ₹{earnings?.pendingEarnings?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-100 text-xs">Paid Out</span>
              <span className="text-lg font-semibold">
                ₹{earnings?.paidEarnings?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile First */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 px-1">Quick Actions</h3>
          
          <Link
            href="/driver/assignments"
            className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">My Deliveries</h4>
                <p className="text-sm text-gray-600">View and manage assignments</p>
              </div>
              <span className="text-blue-600 font-bold text-lg">
                {(stats?.pending || 0) + (stats?.inProgress || 0)}
              </span>
            </div>
          </Link>

          <Link
            href="/driver/earnings"
            className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow active:scale-95"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Earnings History</h4>
                <p className="text-sm text-gray-600">Track your income</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
