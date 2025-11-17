"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Calendar, DollarSign, Download } from "lucide-react";

interface Earning {
  _id: string;
  baseAmount: number;
  distanceBonus: number;
  peakHourBonus: number;
  totalAmount: number;
  platformCommission: number;
  netAmount: number;
  status: string;
  earnedAt: string;
  shipmentId: {
    trackingNumber: string;
  };
  orderId: {
    orderNumber: string;
  };
}

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch("/api/delivery/earnings");
      
      if (res.status === 404) {
        setError("No delivery profile found. Please apply to become a delivery partner.");
        setLoading(false);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setEarnings(data.data.earnings);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      setError("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    const amount = parseFloat(payoutAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (summary && amount > summary.pendingEarnings) {
      alert("Insufficient balance");
      return;
    }

    try {
      const res = await fetch("/api/delivery/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (res.ok) {
        alert("Payout request submitted successfully!");
        setShowPayoutModal(false);
        setPayoutAmount("");
        fetchEarnings();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to request payout");
      }
    } catch (error) {
      console.error("Error requesting payout:", error);
      alert("Failed to request payout");
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
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Delivery Profile
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/deliveryapplication"
            className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Apply as Delivery Partner
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Earnings
        </h1>
        <p className="text-gray-600 mt-1">Track your delivery income</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Total Earnings</h3>
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">
            ₹{summary?.totalEarnings?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">
              Pending Balance
            </h3>
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">
            ₹{summary?.pendingEarnings?.toFixed(2) || "0.00"}
          </p>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="mt-4 w-full bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Request Payout
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">Paid Out</h3>
            <Download className="h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">
            ₹{summary?.paidEarnings?.toFixed(2) || "0.00"}
          </p>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Earnings
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Order
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Base
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Bonus
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Commission
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                  Net Amount
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((earning) => (
                <tr key={earning._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(earning.earnedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {earning.orderId?.orderNumber || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">
                    ₹{earning.baseAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm text-green-600 text-right">
                    +₹
                    {(earning.distanceBonus + earning.peakHourBonus).toFixed(
                      2
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-red-600 text-right">
                    -₹{earning.platformCommission.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                    ₹{earning.netAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        earning.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : earning.status === "processed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {earning.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {earnings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No earnings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Request Payout</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Available Balance</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{summary?.pendingEarnings?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payout Amount
              </label>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter amount"
                min="100"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum payout: ₹100
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setPayoutAmount("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={requestPayout}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
