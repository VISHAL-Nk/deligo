// src/app/admin/layout.tsx

import { redirect } from "next/navigation";
import { Session } from "@/lib/Session";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminFooter from "@/components/admin/AdminFooter";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await Session();

  // Check if user is admin - either current role is admin OR original role is admin (role simulator)
  const isAdmin = session?.user?.role === "admin" || session?.user?.originalRole === "admin";
  
  if (!session || !isAdmin) {
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
        <AdminFooter />
      </div>
    </div>
  );
}
