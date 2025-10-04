// src/components/admin/AdminHeader.tsx

"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
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

export default function AdminHeader() {
  const { data: session } = useSession();
  const extendedSession = session as ExtendedSession | null;

  return (
    <header className="fixed left-0 right-0 top-0 z-30 border-b border-gray-200 bg-white lg:left-64">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Spacer for mobile menu button - reduced since button is now lower */}
          <div className="w-0 lg:hidden"></div>
          <h2 className="text-lg font-semibold text-gray-800 sm:text-xl">
            Admin Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white sm:h-10 sm:w-10">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="hidden text-sm sm:block">
              <p className="font-medium text-gray-900">
                {extendedSession?.user?.email || "Admin"}
              </p>
              <p className="text-gray-500 capitalize">{extendedSession?.user?.role || "admin"}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:px-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
