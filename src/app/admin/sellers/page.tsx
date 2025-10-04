// src/app/admin/sellers/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import SellerTable from "@/components/admin/SellerTable";
import { RefreshCw } from "lucide-react";

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
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-600" />
            <p className="mt-2 text-gray-600">Loading sellers...</p>
          </div>
        </div>
      ) : sellers.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <p className="text-gray-600">No sellers found</p>
        </div>
      ) : (
        <SellerTable sellers={sellers} onRefresh={fetchSellers} />
      )}
    </div>
  );
}
