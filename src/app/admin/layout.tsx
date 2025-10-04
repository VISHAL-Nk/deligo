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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <AdminHeader />
        <main className="mt-16 flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
