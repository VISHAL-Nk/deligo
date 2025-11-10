// src/components/admin/UserTable.tsx

"use client";

import { useState } from "react";
import { Trash2, Ban, CheckCircle, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

interface User {
  _id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profile?: Record<string, unknown>;
}

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
}

export default function UserTable({ users, onRefresh }: UserTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const handleAction = async (
    userId: string,
    action: "activate" | "deactivate" | "delete"
  ) => {
    setLoading(userId);
    setActionMenuOpen(null);

    try {
      if (action === "delete") {
        const response = await fetch(`/api/admin/users?userId=${userId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          toast.success("User deleted successfully");
          onRefresh();
        }
      } else {
        const response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, action }),
        });
        const data = await response.json();
        if (data.success) {
          toast.success(data.message);
          onRefresh();
        }
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Failed to perform action");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Joined
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">
                  {user.email}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    user.isVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isVerified ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="relative whitespace-nowrap px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setActionMenuOpen(
                        actionMenuOpen === user._id ? null : user._id
                      )
                    }
                    className="rounded p-1 hover:bg-gray-100"
                    disabled={loading === user._id}
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>

                  {actionMenuOpen === user._id && (
                    <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                      <div className="py-1">
                        {user.isVerified ? (
                          <button
                            onClick={() => handleAction(user._id, "deactivate")}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Ban className="h-4 w-4" />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(user._id, "activate")}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this user?"
                              )
                            ) {
                              handleAction(user._id, "delete");
                            }
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
