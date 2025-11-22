// src/components/admin/SellerTable.tsx

"use client";

import { useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";
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
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (sellerId: string) => {
    setLoading(sellerId);

    try {
      const response = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, action: "approve" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        onRefresh();
      } else {
        toast.error(data.error || "Failed to approve seller");
      }
    } catch (error) {
      console.error("Error approving seller:", error);
      toast.error("Failed to approve seller");
    } finally {
      setLoading(null);
    }
  };

  const openRejectModal = (sellerId: string) => {
    setSelectedSeller(sellerId);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedSeller(null);
    setRejectionReason("");
  };

  const handleReject = async () => {
    if (!selectedSeller) return;
    
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(selectedSeller);

    try {
      const response = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sellerId: selectedSeller, 
          action: "reject",
          rejectionReason: rejectionReason.trim()
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        closeRejectModal();
        onRefresh();
      } else {
        toast.error(data.error || "Failed to reject seller");
      }
    } catch (error) {
      console.error("Error rejecting seller:", error);
      toast.error("Failed to reject seller");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Reject Seller Application</h3>
              <button
                onClick={closeRejectModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Please provide a reason for rejecting this seller application. This will be shown to the seller.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={closeRejectModal}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading === selectedSeller || !rejectionReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading === selectedSeller ? "Rejecting..." : "Reject Application"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      onClick={() => handleApprove(seller._id)}
                      disabled={loading === seller._id}
                      className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(seller._id)}
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
    </>
  );
}
