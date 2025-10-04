// src/app/admin/role-simulator/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserCircle, Store, Truck, ShoppingBag, RotateCcw } from "lucide-react";
import type { Session } from "next-auth";

interface ExtendedSession extends Session {
  user: {
    id: string;
    email: string;
    role: "customer" | "seller" | "delivery" | "support" | "admin";
    isVerified: boolean;
    hasProfile: boolean;
    name: string | null;
    image?: string | null;
  };
}

export default function RoleSimulatorPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState((session as ExtendedSession | null)?.user?.role || "admin");

  const roles = [
    {
      id: "customer",
      name: "Customer",
      description: "Browse products, add to cart, and place orders",
      icon: UserCircle,
      color: "bg-blue-100 text-blue-600",
      redirectTo: "/products",
    },
    {
      id: "seller",
      name: "Seller",
      description: "List products and manage your inventory",
      icon: Store,
      color: "bg-purple-100 text-purple-600",
      redirectTo: "/seller/dashboard",
    },
    {
      id: "delivery",
      name: "Delivery Partner",
      description: "View assigned deliveries and update status",
      icon: Truck,
      color: "bg-orange-100 text-orange-600",
      redirectTo: "/delivery/dashboard",
    },
  ];

  const handleRoleSwitch = async (role: string, redirectTo: string) => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/role-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (data.success) {
        // Update session
        await update();
        setCurrentRole(role as "customer" | "seller" | "delivery" | "support" | "admin");
        
        // Redirect to role-specific page
        setTimeout(() => {
          router.push(redirectTo);
        }, 1000);

        alert(`Successfully switched to ${role} role!`);
      } else {
        alert(data.error || "Failed to switch role");
      }
    } catch (error) {
      console.error("Error switching role:", error);
      alert("Failed to switch role");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreRole = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/role-switch", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await update();
        setCurrentRole("admin");
        router.push("/admin");
        alert("Successfully restored to admin role!");
      } else {
        alert(data.error || "Failed to restore role");
      }
    } catch (error) {
      console.error("Error restoring role:", error);
      alert("Failed to restore role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Simulator</h1>
        <p className="mt-2 text-gray-600">
          Experience the platform from different user perspectives
        </p>
      </div>

      {/* Current Role Badge */}
      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Currently playing as</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {currentRole}
            </p>
          </div>
          {currentRole !== "admin" && (
            <button
              onClick={handleRestoreRole}
              disabled={loading}
              className="ml-auto flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Restore Admin Role
            </button>
          )}
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <div
              key={role.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${role.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {role.name}
                  </h3>
                </div>
              </div>
              <p className="mb-6 text-sm text-gray-600">{role.description}</p>
              <button
                onClick={() => handleRoleSwitch(role.id, role.redirectTo)}
                disabled={loading || currentRole === role.id}
                className={`w-full rounded-lg px-4 py-2 text-white transition-colors ${
                  currentRole === role.id
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                } disabled:opacity-50`}
              >
                {currentRole === role.id ? "Current Role" : `Play as ${role.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Information Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4">
          <ShoppingBag className="h-6 w-6 flex-shrink-0 text-blue-600" />
          <div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              How Role Simulation Works
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>
                  Switch to different roles to experience how users interact with the platform
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>
                  Each role has specific pages and features tailored to their needs
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>
                  You can restore your admin role anytime by clicking the &quot;Restore Admin Role&quot; button
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                <span>
                  Your original admin privileges are preserved and can be restored
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
