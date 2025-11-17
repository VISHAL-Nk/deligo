import { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
