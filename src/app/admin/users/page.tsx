// src/app/admin/users/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import UserTable from "@/components/admin/UserTable";
import { RefreshCw } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage all users on the platform
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none focus:ring-green-500"
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
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <UserTable users={users} onRefresh={fetchUsers} />
      )}
    </div>
  );
}
