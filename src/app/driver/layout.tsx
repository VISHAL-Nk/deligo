import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export default async function DriverLayout({
  children,
}: {
  children: ReactNode;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (await getServerSession(authOptions as any)) as any;

  // Redirect if not logged in
  if (!session) {
    redirect("/auth/signin");
  }

  // Check if user has delivery role
  if (session.user?.role !== "delivery") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
