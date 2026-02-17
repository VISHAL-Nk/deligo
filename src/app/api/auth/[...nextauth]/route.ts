// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

// Workaround for NextAuth v4 typing issues in App Router
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NextAuthHandler = NextAuth as any;
const handler = NextAuthHandler(authOptions);

export const GET = handler;
export const POST = handler;
