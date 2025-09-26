
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: "customer" | "seller" | "delivery" | "support" | "admin";
      isVerified: boolean;
      hasProfile: boolean;
      name:string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: "customer" | "seller" | "delivery" | "support" | "admin";
    isVerified: boolean;
    hasProfile: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "customer" | "seller" | "delivery" | "support" | "admin";
    isVerified: boolean;
    hasProfile: boolean;
  }
}
