"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Phone, MapPin, CreditCard, Bike } from "lucide-react";

interface DeliveryProfile {
  vehicleType: string;
  licenseNumber: string;
  region: string;
  isOnline: boolean;
  rating: number;
  status: string;
  kycStatus: string;
  totalDeliveries: number;
  completedDeliveries: number;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
}

export default function DriverProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/delivery/application");
      
      if (res.status === 404) {
        setError("No delivery profile found. Please apply to become a delivery partner.");
        setLoading(false);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
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
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
          My Profile
        </h1>
        <p className="text-gray-600 mt-1">Manage your delivery partner profile</p>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Personal Information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{session?.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      {profile && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Vehicle Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Bike className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Vehicle Type</p>
                <p className="font-medium capitalize">{profile.vehicleType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">License Number</p>
                <p className="font-medium">{profile.licenseNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Region</p>
                <p className="font-medium">{profile.region}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {profile && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Performance Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {profile.rating.toFixed(1)} ⭐
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-blue-600">
                {profile.totalDeliveries}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {profile.completedDeliveries}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {profile.totalDeliveries > 0
                  ? (
                      (profile.completedDeliveries / profile.totalDeliveries) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      {profile && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">KYC Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.kycStatus === "approved"
                    ? "bg-green-100 text-green-800"
                    : profile.kycStatus === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {profile.kycStatus.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Account Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {profile.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Online Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile.isOnline
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {profile.isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bank Details */}
      {profile?.bankDetails && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bank Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Account Holder Name</p>
              <p className="font-medium">
                {profile.bankDetails.accountHolderName || "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="font-medium">
                {profile.bankDetails.accountNumber
                  ? `****${profile.bankDetails.accountNumber.slice(-4)}`
                  : "Not provided"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">IFSC Code</p>
              <p className="font-medium">
                {profile.bankDetails.ifsc || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
