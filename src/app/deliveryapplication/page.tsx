"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Car, Truck, Check } from "lucide-react";

export default function DeliveryApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    vehicleType: "",
    licenseNumber: "",
    region: "",
    hasInsurance: false,
    hasVehicleRegistration: false,
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    agreedToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/delivery/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        router.push("/");
      } else {
        alert(data.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const vehicleTypes = [
    { value: "bike", label: "Bike/Motorcycle", icon: Bike },
    { value: "scooter", label: "Scooter", icon: Bike },
    { value: "car", label: "Car", icon: Car },
    { value: "van", label: "Van/Truck", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Become a Delivery Partner
            </h1>
            <p className="text-gray-600 mt-2">
              Join our delivery network and start earning today!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region/City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Vehicle Information
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vehicle Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vehicleTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, vehicleType: type.value })
                      }
                      className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                        formData.vehicleType === type.value
                          ? "border-green-600 bg-green-50"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      <type.icon
                        className={`h-8 w-8 ${
                          formData.vehicleType === type.value
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasInsurance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasInsurance: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I have valid vehicle insurance
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasVehicleRegistration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasVehicleRegistration: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I have valid vehicle registration
                  </span>
                </label>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bank Details (Optional)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountHolderName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) =>
                      setFormData({ ...formData, ifscCode: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="border-t pt-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  required
                  checked={formData.agreedToTerms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agreedToTerms: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the{" "}
                  <a href="#" className="text-green-600 hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-green-600 hover:underline">
                    Privacy Policy
                  </a>
                  *
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why Join Us?
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <Check className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700">
                Flexible working hours - Work when you want
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700">
                Competitive earnings with bonuses
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700">
                Weekly payouts directly to your bank account
              </span>
            </li>
            <li className="flex items-start">
              <Check className="h-6 w-6 text-green-600 mr-3 flex-shrink-0" />
              <span className="text-gray-700">
                24/7 support for delivery partners
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
