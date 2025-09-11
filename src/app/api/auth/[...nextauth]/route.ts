// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import UserProfile from "@/models/UserProfiles.models";
import type { UserDocument } from "@/types/mongooose";
import type { User as NextAuthUser } from "next-auth";
import { loginSchema, LoginInput } from "@/schema/signInSchema";
import { z } from "zod";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        await dbConnect();

        try {
          const parsed: LoginInput = loginSchema.parse(credentials);

          const user: UserDocument | null = await User.findOne({
            email: parsed.email,
          });
          if (!user) throw new Error("User not found");

          if (!user.passwordHash) throw new Error("Use OAuth to login");

          const isValid = await bcrypt.compare(parsed.password, user.passwordHash);
          if (!isValid) throw new Error("Invalid password");

          if (!user.isVerified) throw new Error("Please verify your email first");

          user.lastLoginAt = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            hasProfile: user.hasProfile,
          };
        } catch (err) {
          if (err instanceof z.ZodError) {
            throw new Error(err.issues.map(e => e.message).join(", "));
          }
          throw err;
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-email",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger, account }) {
      if (user) {
        // For OAuth providers, we need to find the user by email since user.id is the provider's ID
        if (account?.provider !== "credentials") {
          await dbConnect();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.isVerified = dbUser.isVerified;
            token.hasProfile = dbUser.hasProfile;
          }
        } else {
          // For credentials provider, user.id is already the correct MongoDB ObjectId
          token.id = user.id;
          token.role = (user as NextAuthUser).role as
            | "customer"
            | "seller"
            | "delivery"
            | "support"
            | "admin";
          token.isVerified = (user as NextAuthUser).isVerified;
          token.hasProfile = (user as NextAuthUser).hasProfile;
        }
      }

      // Refresh user data on update trigger or when hasProfile is missing
      if (trigger === "update" || (!token.hasProfile && token.id)) {
        await dbConnect();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.isVerified = dbUser.isVerified;
          token.role = dbUser.role;
          token.hasProfile = dbUser.hasProfile;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as
          | "customer"
          | "seller"
          | "delivery"
          | "support"
          | "admin";
        session.user.isVerified = token.isVerified as boolean;
        session.user.hasProfile = token.hasProfile as boolean;
      }
      return session;
    },
    async signIn({ user, account }) {
      await dbConnect();

      let existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        // Create new user
        existingUser = await User.create({
          email: user.email,
          role: "customer",
          isVerified: account?.provider !== "credentials",
          hasProfile: false,
        });

        // Create basic profile with name from OAuth provider if available
        await UserProfile.create({
          userId: existingUser._id,
          fullName: user.name || "",
        });

        // If we have a name from OAuth, we can consider the profile as having basic info
        if (user.name) {
          existingUser.hasProfile = true;
          await existingUser.save();
        }
      } else {
        // Check if existing user has a profile
        const existingProfile = await UserProfile.findOne({ userId: existingUser._id });
        if (existingProfile && !existingUser.hasProfile) {
          // User has a profile but hasProfile is false, update it
          existingUser.hasProfile = true;
        }
      }

      existingUser.lastLoginAt = new Date();
      await existingUser.save();

      // Update user object with database ID for OAuth providers
      if (account?.provider !== "credentials") {
        user.id = existingUser._id.toString();
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Handle same origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Prevent redirect loops by checking if we're redirecting to signin
      try {
        const urlObj = new URL(url);
        if (urlObj.pathname === "/auth/signin" && urlObj.origin === baseUrl) {
          return `${baseUrl}/dashboard`; // Redirect to dashboard instead
        }
      } catch (e) {
        console.warn("Invalid URL in redirect:", url);
      }
      
      // Default to base URL for external URLs
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };