// src/app/admin/layout.tsx

import { redirect } from "next/navigation";
import { Session } from "@/lib/Session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await Session();

  if (!session || session.user.role !== "admin") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="pl-64">
        <AdminHeader />
        <main className="mt-16 p-6">{children}</main>
      </div>
    </div>
  );
}
