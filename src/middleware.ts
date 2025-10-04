// src/middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis connection
const redis = Redis.fromEnv();

// Configure rate limiter - 5 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, "60 s"), // 5 requests per 60s
});

export default withAuth(async function middleware(req) {
  // Rate limiting check - get client IP
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";
  
  // Apply rate limiting to API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  const pathname = req.nextUrl.pathname;
  const user = req.nextauth.token;
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
  
  // Helper function to clean callback URL and prevent loops
  const getCleanCallbackUrl = (url: string | null) => {
    if (!url) return null;
    
    try {
      const decoded = decodeURIComponent(url);
      // If callback URL is an auth page, ignore it
      if (decoded.includes("/auth/signin") || 
          decoded.includes("/auth/signup") || 
          decoded.includes("/auth/verify-email") ||
          decoded.includes("/auth/complete-profile")) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  };

  // If user is not authenticated and trying to access auth pages, allow access
  if (!user && pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // If no user and accessing protected routes, redirect to signin
  if (!user) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Helper function to determine where verified user should go
  const getVerifiedUserDestination = () => {
    const cleanCallback = getCleanCallbackUrl(callbackUrl);
    if (cleanCallback) {
      return cleanCallback;
    }
    // Check hasProfile from JWT token instead of database
    return user.hasProfile ? "/products" : "/auth/complete-profile";
  };

  // Handle auth pages when user is already authenticated
  if (pathname === "/auth/signin" || pathname === "/auth/signup") {
    if (user?.isVerified) {
      const destination = getVerifiedUserDestination();
      return NextResponse.redirect(new URL(destination, req.url));
    }
    // If not verified, redirect to verify email
    return NextResponse.redirect(new URL("/auth/verify-email", req.url));
  }

  // Handle verify email page
  if (pathname === "/auth/verify-email") {
    if (user?.isVerified) {
      const destination = getVerifiedUserDestination();
      return NextResponse.redirect(new URL(destination, req.url));
    }
    // If not verified, stay on verify email page
    return NextResponse.next();
  }

  // Handle complete profile page
  if (pathname === "/auth/complete-profile") {
    console.log("Complete profile page - user verification:", user?.isVerified);
    if (!user?.isVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email", req.url));
    }
    
    const hasProfile = user.hasProfile || false;
    console.log("User has profile:", hasProfile);
    
    if (hasProfile) {
      const cleanCallback = getCleanCallbackUrl(callbackUrl);
      const destination = cleanCallback || "/products";
      console.log("User has profile, redirecting to:", destination);
      return NextResponse.redirect(new URL(destination, req.url));
    }
    // If verified but no profile, stay on complete profile page
    console.log("User verified but no profile, staying on complete profile page");
    return NextResponse.next();
  }

  // Handle protected routes - ensure user is verified and has profile
  if (pathname.startsWith("/products") || 
      pathname.startsWith("/admin") || 
      pathname.startsWith("/seller") || 
      pathname.startsWith("/support") || 
      pathname.startsWith("/delivery")) {
    
    console.log("Protected route access - user verification:", user?.isVerified);
    
    if (!user?.isVerified) {
      // Store the current path as callback URL for after verification
      const verifyUrl = new URL("/auth/verify-email", req.url);
      verifyUrl.searchParams.set("callbackUrl", pathname);
      console.log("User not verified, redirecting to verify email with callback:", pathname);
      return NextResponse.redirect(verifyUrl);
    }
    
    const hasProfile = user.hasProfile || false;
    console.log("User has profile:", hasProfile);
    
    if (!hasProfile) {
      // Store the current path as callback URL for after profile completion
      const profileUrl = new URL("/auth/complete-profile", req.url);
      profileUrl.searchParams.set("callbackUrl", pathname);
      console.log("User has no profile, redirecting to complete profile with callback:", pathname);
      return NextResponse.redirect(profileUrl);
    }
  }

  // RBAC (Role-Based Access Control) checks
  // Allow access to admin if user is admin OR has originalRole (role simulator)
  const isRoleSimulating = user?.originalRole !== undefined;
  const isActualAdmin = user?.role === "admin" || user?.originalRole === "admin";
  
  if (!isActualAdmin && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/products", req.url));
  }
  
  // For other role-specific routes, check current role (allow role simulation)
  if (user?.role !== "seller" && !isRoleSimulating && pathname.startsWith("/seller")) {
    return NextResponse.redirect(new URL("/products", req.url));
  }
  if (user?.role !== "support" && !isRoleSimulating && pathname.startsWith("/support")) {
    return NextResponse.redirect(new URL("/products", req.url));
  }
  if (user?.role !== "delivery" && !isRoleSimulating && pathname.startsWith("/delivery")) {
    return NextResponse.redirect(new URL("/products", req.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}, {
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;
      
      // Always allow access to auth pages
      if (pathname.startsWith("/auth/")) {
        return true;
      }
      
      // For protected routes, require a token
      if (pathname.startsWith("/products") || 
          pathname.startsWith("/admin") || 
          pathname.startsWith("/seller") || 
          pathname.startsWith("/support") || 
          pathname.startsWith("/delivery")) {
        return !!token;
      }
      
      // For public routes (like homepage), allow access without token
      return true;
    },
  },
});

// Apply middleware to protected routes, auth pages, and API routes
export const config = {
  matcher: [
    "/products/:path*",
    "/admin/:path*",
    "/seller/:path*",
    "/support/:path*",
    "/delivery/:path*",
    "/auth/:path*",
    "/api/:path*"
  ],
};