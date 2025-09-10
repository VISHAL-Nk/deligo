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
        const user: UserDocument | null = await User.findOne({ email: credentials?.email });
        if (!user) throw new Error("User not found");

        if (!user.passwordHash) throw new Error("Use OAuth to login");

        const isValid = await bcrypt.compare(
          credentials!.password,
          user.passwordHash
        );
        if (!isValid) throw new Error("Invalid password");

        if (!user.isVerified) throw new Error("Please verify your email first");

        user.lastLoginAt = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        };
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as NextAuthUser).role as
          | "customer"
          | "seller"
          | "delivery"
          | "support"
          | "admin";

        token.isVerified = (user as NextAuthUser).isVerified;
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
      }
      return session;
    },
    async signIn({ user, account }) {
      await dbConnect();

      let existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        existingUser = await User.create({
          email: user.email,
          role: "customer",
          isVerified: account?.provider !== "credentials",
        });

        await UserProfile.create({
          userId: existingUser._id,
          fullName: user.name || "",
        });
      }

      existingUser.lastLoginAt = new Date();
      await existingUser.save();

      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
