"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  MapPin,
  Phone,
  Package,
  CheckCircle,
  QrCode,
  Navigation as NavigationIcon,
} from "lucide-react";

interface Shipment {
  _id: string;
  trackingNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderId: {
    _id: string;
    totalAmount: number;
  };
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchShipment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      const res = await fetch("/api/delivery/assignments");
      if (res.ok) {
        const data = await res.json();
        const found = data.data.shipments.find(
          (s: Shipment) => s._id === params.id
        );
        setShipment(found);
      }
    } catch (error) {
      console.error("Error fetching shipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/delivery/shipments/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`);
        fetchShipment();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const verifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const res = await fetch(`/api/delivery/shipments/${params.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpInput }),
      });

      if (res.ok) {
        toast.success("Delivery verified successfully!");
        setShowOtpModal(false);
        router.push("/driver/assignments");
      } else {
        const data = await res.json();
        toast.error(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP");
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-600">Shipment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {shipment.trackingNumber}
            </h1>
            <p className="text-sm text-gray-600">
              Order: {shipment.orderId?._id ? `#${shipment.orderId._id.slice(-8).toUpperCase()}` : "N/A"}
            </p>
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {shipment.status.replace("_", " ").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Delivery Steps Guide */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">📋 Delivery Steps:</h3>
        <ol className="text-sm text-gray-700 space-y-1">
          <li className={shipment.status === "assigned" ? "font-semibold text-green-600" : ""}>
            1. Accept the assignment
          </li>
          <li className={shipment.status === "accepted" ? "font-semibold text-green-600" : ""}>
            2. Mark as picked up from seller
          </li>
          <li className={shipment.status === "picked_up" ? "font-semibold text-green-600" : ""}>
            3. Start transit to customer
          </li>
          <li className={shipment.status === "in-transit" ? "font-semibold text-green-600" : ""}>
            4. Enter OTP from customer to complete delivery
          </li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {shipment.status === "assigned" && (
          <button
            onClick={() => updateStatus("accepted")}
            className="col-span-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Accept Assignment
          </button>
        )}

        {shipment.status === "accepted" && (
          <button
            onClick={() => updateStatus("picked_up")}
            className="col-span-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Package className="h-5 w-5 mr-2" />
            Mark as Picked Up
          </button>
        )}

        {shipment.status === "picked_up" && (
          <button
            onClick={() => updateStatus("in-transit")}
            className="col-span-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <NavigationIcon className="h-5 w-5 mr-2" />
            Start Transit to Customer
          </button>
        )}

        {shipment.status === "in-transit" && (
          <button
            onClick={() => setShowOtpModal(true)}
            className="col-span-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Complete Delivery (Enter OTP)
          </button>
        )}
      </div>

      {/* Addresses */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start space-x-3">
            <MapPin className="h-6 w-6 text-orange-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Pickup Address
              </h3>
              <p className="text-gray-600">
                {shipment.pickupAddress?.street}
              </p>
              <p className="text-gray-600">
                {shipment.pickupAddress?.city}, {shipment.pickupAddress?.state}{" "}
                {shipment.pickupAddress?.zipCode}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start space-x-3">
            <MapPin className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Delivery Address
              </h3>
              <p className="text-gray-600">
                {shipment.deliveryAddress?.street}
              </p>
              <p className="text-gray-600">
                {shipment.deliveryAddress?.city},{" "}
                {shipment.deliveryAddress?.state}{" "}
                {shipment.deliveryAddress?.zipCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Customer Details</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600">{shipment.customerName}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <a
              href={`tel:${shipment.customerPhone}`}
              className="text-green-600 hover:underline"
            >
              {shipment.customerPhone}
            </a>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Verify Delivery OTP</h3>
            <p className="text-gray-600 mb-4">
              Ask the customer for the 6-digit OTP
            </p>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest mb-4"
              placeholder="000000"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyOTP}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
