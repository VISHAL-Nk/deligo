// src/components/admin/RoleSimulatorBanner.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, RotateCcw, X } from "lucide-react";
import { useState } from "react";
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
    originalRole?: string;
  };
}

export default function RoleSimulatorBanner() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const extendedSession = session as ExtendedSession | null;
  const originalRole = extendedSession?.user?.originalRole;
  const currentRole = extendedSession?.user?.role;

  // Only show banner if user is role simulating (has originalRole)
  if (!originalRole || isHidden) {
    return null;
  }

  const handleRestoreRole = async () => {
    setIsRestoring(true);

    try {
      const response = await fetch("/api/admin/role-switch", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await update();
        router.push("/admin");
      } else {
        alert(data.error || "Failed to restore role");
      }
    } catch (error) {
      console.error("Error restoring role:", error);
      alert("Failed to restore role");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBackToAdmin = () => {
    router.push("/admin");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md">
      <div className="rounded-lg border-2 border-green-500 bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Role Simulation Active
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  You&apos;re testing as{" "}
                  <span className="font-medium capitalize text-green-600">
                    {currentRole}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Original role: {originalRole}
                </p>
              </div>
              
              {/* Hide button */}
              <button
                onClick={() => setIsHidden(true)}
                className="ml-2 text-gray-400 hover:text-gray-600"
                title="Hide banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleBackToAdmin}
                className="flex items-center gap-1.5 rounded-lg border border-green-600 bg-white px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Panel
              </button>
              
              <button
                onClick={handleRestoreRole}
                disabled={isRestoring}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {isRestoring ? "Restoring..." : "End Simulation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
