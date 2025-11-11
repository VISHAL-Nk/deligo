// src/components/admin/SellerTable.tsx

"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

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

interface SellerTableProps {
  sellers: Seller[];
  onRefresh: () => void;
}

export default function SellerTable({ sellers, onRefresh }: SellerTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (sellerId: string, action: "approve" | "reject") => {
    setLoading(sellerId);

    try {
      const response = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, action }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        onRefresh();
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Business Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              GST Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Rating
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              KYC Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sellers.map((seller) => (
            <tr key={seller._id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {seller.businessName}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {seller.userId?.email || "N/A"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {seller.gstNumber || "N/A"}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {seller.rating.toFixed(1)}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">/ 5.0</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    seller.kycStatus === "approved"
                      ? "bg-green-100 text-green-800"
                      : seller.kycStatus === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {seller.kycStatus}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {seller.kycStatus === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(seller._id, "approve")}
                      disabled={loading === seller._id}
                      className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(seller._id, "reject")}
                      disabled={loading === seller._id}
                      className="flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
