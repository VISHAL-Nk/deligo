// src/app/admin/users/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import UserTable from "@/components/admin/UserTable";
import { RefreshCw } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface User {
  _id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profile?: Record<string, unknown>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?role=${filter}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [filter, fetchUsers]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-gray-600 sm:mt-2">
            Manage all users on the platform
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 sm:text-base"
        >
          <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="seller">Sellers</option>
          <option value="delivery">Delivery Partners</option>
          <option value="support">Support</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-600" />
            <p className="mt-2 text-sm text-gray-600 sm:text-base">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <EmptyState 
            variant="users"
            description={filter !== 'all' ? `No ${filter}s found. Try changing the filter.` : 'There are no users matching your criteria.'}
            showRetry
            onRetry={fetchUsers}
          />
        </div>
      ) : (
        <UserTable users={users} onRefresh={fetchUsers} />
      )}
    </div>
  );
}
