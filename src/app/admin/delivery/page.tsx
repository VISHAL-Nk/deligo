// src/app/admin/delivery/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import DeliveryTable from "@/components/admin/DeliveryTable";
import { RefreshCw } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface DeliveryPartner {
  _id: string;
  vehicleType: string;
  licenseNumber: string;
  region: string;
  rating: number;
  kycStatus: "pending" | "approved" | "rejected";
  status: "active" | "inactive" | "suspended";
  userId: {
    email: string;
  };
  createdAt: string;
}

export default function DeliveryPage() {
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchDeliveryPartners = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/delivery?status=${filter}`);
      const data = await response.json();
      if (data.success) {
        setDeliveryPartners(data.deliveryPartners);
      }
    } catch (error) {
      console.error("Error fetching delivery partners:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDeliveryPartners();
  }, [filter, fetchDeliveryPartners]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Delivery Partner Management
          </h1>
          <p className="mt-2 text-gray-600">
            Approve or reject delivery partner applications
          </p>
        </div>
        <button
          onClick={fetchDeliveryPartners}
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
            <p className="mt-2 text-gray-600">
              Loading delivery partners...
            </p>
          </div>
        </div>
      ) : deliveryPartners.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <EmptyState 
            variant="delivery"
            description={filter !== 'all' ? `No ${filter} delivery partner applications found.` : 'There are no delivery partner applications to review at the moment.'}
            showRetry
            onRetry={fetchDeliveryPartners}
          />
        </div>
      ) : (
        <DeliveryTable
          deliveryPartners={deliveryPartners}
          onRefresh={fetchDeliveryPartners}
        />
      )}
    </div>
  );
}
