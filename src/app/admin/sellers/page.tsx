// src/app/admin/sellers/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import SellerTable from "@/components/admin/SellerTable";
import { RefreshCw } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface Seller {
  _id: string;
  businessName: string;
  gstNumber?: string;
  kycStatus: "pending" | "approved" | "rejected";
  rating: number;
  userId: {
    email: string;
  };
  createdAt: string;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sellers?status=${filter}`);
      const data = await response.json();
      if (data.success) {
        setSellers(data.sellers);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSellers();
  }, [filter, fetchSellers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Seller Management
          </h1>
          <p className="mt-2 text-gray-600">
            Approve or reject seller applications
          </p>
        </div>
        <button
          onClick={fetchSellers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          Filter by Status:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-green-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {/* Table header skeleton */}
          <div className="bg-gray-50 p-4 border-b flex gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-24 skeleton-shimmer"></div>
            ))}
          </div>
          {/* Table rows skeleton */}
          {[1, 2, 3, 4, 5].map(row => (
            <div key={row} className="p-4 border-b flex gap-4 items-center">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40 skeleton-shimmer"></div>
                <div className="h-3 bg-gray-200 rounded w-32 skeleton-shimmer"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-28 skeleton-shimmer"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20 skeleton-shimmer"></div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <div key={star} className="w-4 h-4 bg-gray-200 rounded skeleton-shimmer"></div>
                ))}
              </div>
              <div className="h-8 bg-gray-200 rounded w-24 skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <EmptyState 
            variant="sellers"
            description={filter !== 'all' ? `No ${filter} seller applications found.` : 'There are no seller applications to review at the moment.'}
            showRetry
            onRetry={fetchSellers}
          />
        </div>
      ) : (
        <SellerTable sellers={sellers} onRefresh={fetchSellers} />
      )}
    </div>
  );
}
