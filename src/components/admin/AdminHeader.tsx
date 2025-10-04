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
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Admin Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
              <User className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">
                {extendedSession?.user?.email || "Admin"}
              </p>
              <p className="text-gray-500 capitalize">{extendedSession?.user?.role || "admin"}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
