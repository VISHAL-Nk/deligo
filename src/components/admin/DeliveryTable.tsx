// src/components/admin/DeliveryTable.tsx

"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

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

interface DeliveryTableProps {
  deliveryPartners: DeliveryPartner[];
  onRefresh: () => void;
}

export default function DeliveryTable({
  deliveryPartners,
  onRefresh,
}: DeliveryTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    deliveryId: string,
    action: "approve" | "reject"
  ) => {
    setLoading(deliveryId);

    try {
      const response = await fetch("/api/admin/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryId, action }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        onRefresh();
      }
    } catch (error) {
      console.error("Error performing action:", error);
      alert("Failed to perform action");
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
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Vehicle Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              License Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Region
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
          {deliveryPartners.map((partner) => (
            <tr key={partner._id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {partner.userId?.email || "N/A"}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  {partner.vehicleType}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {partner.licenseNumber}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {partner.region}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {partner.rating.toFixed(1)}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">/ 5.0</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    partner.kycStatus === "approved"
                      ? "bg-green-100 text-green-800"
                      : partner.kycStatus === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {partner.kycStatus}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                {partner.kycStatus === "pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(partner._id, "approve")}
                      disabled={loading === partner._id}
                      className="flex items-center gap-1 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(partner._id, "reject")}
                      disabled={loading === partner._id}
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
