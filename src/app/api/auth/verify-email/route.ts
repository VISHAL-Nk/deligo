// app/api/auth/verify-email/route.ts
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import { verifyEmailToken } from "@/lib/emailToken";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return new Response("Invalid request", { status: 400 });

  const payload = verifyEmailToken(token);
  if (!payload)
    return new Response("Invalid or expired token", { status: 400 });

  await User.findByIdAndUpdate(payload.userId, { isVerified: true });

  return Response.redirect(
    new URL("/auth/complete-profile", process.env.NEXT_PUBLIC_APP_URL)
  );
}
