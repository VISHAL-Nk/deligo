// src/components/admin/RoleSimulatorBanner.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { Session } from "next-auth";
import toast from "react-hot-toast";

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
        toast.error(data.error || "Failed to restore role");
      }
    } catch (error) {
      console.error("Error restoring role:", error);
      toast.error("Failed to restore role");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBackToAdmin = () => {
    router.push("/admin");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm sm:bottom-6 sm:right-6 sm:max-w-md">
      <div className="rounded-lg border-2 border-green-500 bg-white p-3 shadow-2xl sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Icon */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-10 sm:w-10">
            <ShieldCheck className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-gray-900 sm:text-sm">
                  Role Simulation Active
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Testing as{" "}
                  <span className="font-medium capitalize text-green-600">
                    {currentRole}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500 hidden sm:block">
                  Original: {originalRole}
                </p>
              </div>
              
              {/* Hide button */}
              <button
                onClick={() => setIsHidden(true)}
                className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                title="Hide banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex flex-wrap gap-2 sm:mt-3">
              <button
                onClick={handleBackToAdmin}
                className="flex items-center gap-1.5 rounded-lg border border-green-600 bg-white px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 sm:px-3"
              >
                <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </button>
              
              <button
                onClick={handleRestoreRole}
                disabled={isRestoring}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 sm:px-3"
              >
                <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {isRestoring ? "Restoring..." : "End"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
