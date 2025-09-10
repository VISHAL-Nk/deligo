import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "customer" | "seller" | "delivery" | "support" | "admin";
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    role: "customer" | "seller" | "delivery" | "support" | "admin";
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "customer" | "seller" | "delivery" | "support" | "admin";
    isVerified: boolean;
  }
}
