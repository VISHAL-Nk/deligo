"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Clock, Phone, Package, Navigation } from "lucide-react";

interface Shipment {
  _id: string;
  trackingNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  estimatedDelivery: string;
  orderId: {
    orderNumber: string;
    totalAmount: number;
  };
}

export default function AssignmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      let url = "/api/delivery/assignments";
      if (filter !== "all") {
        url += `?status=${filter}`;
      }

      const res = await fetch(url);
      
      if (res.status === 404) {
        setError("No delivery profile found. Please apply to become a delivery partner.");
        setLoading(false);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setShipments(data.data.shipments);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "in-transit":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Delivery Profile
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/deliveryapplication"
            className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Apply as Delivery Partner
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          My Deliveries
        </h1>
        <p className="text-gray-600 mt-1">Manage your delivery assignments</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex space-x-2 overflow-x-auto">
          {["all", "assigned", "accepted", "picked_up", "in-transit"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  filter === status
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            )
          )}
        </div>
      </div>

      {/* Shipments List */}
      <div className="space-y-4">
        {shipments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No deliveries found
            </h3>
            <p className="text-gray-600 mt-1">
              {filter === "all"
                ? "You don't have any assignments yet"
                : `No ${filter} deliveries`}
            </p>
          </div>
        ) : (
          shipments.map((shipment) => (
            <div
              key={shipment._id}
              className="bg-white rounded-lg shadow-sm p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {shipment.trackingNumber}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        shipment.status
                      )}`}
                    >
                      {shipment.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Order: {shipment.orderId?.orderNumber || "N/A"}
                  </p>
                </div>
                <Link
                  href={`/driver/delivery/${shipment._id}`}
                  className="mt-4 md:mt-0 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center justify-center"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Delivery Address
                    </p>
                    <p className="text-sm text-gray-600">
                      {shipment.deliveryAddress?.street},{" "}
                      {shipment.deliveryAddress?.city}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shipment.deliveryAddress?.state}{" "}
                      {shipment.deliveryAddress?.zipCode}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {shipment.customerName && (
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Customer
                        </p>
                        <p className="text-sm text-gray-600">
                          {shipment.customerName}
                        </p>
                      </div>
                    </div>
                  )}

                  {shipment.customerPhone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Phone
                        </p>
                        <a
                          href={`tel:${shipment.customerPhone}`}
                          className="text-sm text-green-600 hover:underline"
                        >
                          {shipment.customerPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {shipment.estimatedDelivery && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Estimated Delivery
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            shipment.estimatedDelivery
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
