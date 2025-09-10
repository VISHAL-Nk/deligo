import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const user = req.nextauth.token;

    // not signed in handled by callbacks.authorized
    if (!user) return;

    // 1. Block unverified users (except verify page)
    if (!user.isVerified && !pathname.startsWith("/auth/verify-email")) {
      return NextResponse.redirect(new URL("/auth/verify-email", req.url));
    }

    // 2. Block users without completed profile (except profile page)
    if (user.isVerified && !user.hasProfile && !pathname.startsWith("/auth/complete-profile")) {
      return NextResponse.redirect(new URL("/auth/complete-profile", req.url));
    }

    // 3. Role-based routing
    if (pathname.startsWith("/admin") && user?.role !== "admin") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    if (pathname.startsWith("/seller") && user?.role !== "seller") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    if (pathname.startsWith("/support") && user?.role !== "support") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    if (pathname.startsWith("/delivery") && user?.role !== "delivery") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // only allow signed-in users
    },
  }
);

// Apply middleware only on protected routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/seller/:path*",
    "/support/:path*",
    "/delivery/:path*",
  ],
};
