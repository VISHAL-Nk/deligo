// app/api/auth/verify-email/route.ts
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import { verifyEmailToken } from "@/lib/emailToken";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response(JSON.stringify({message:"Check email for verification"}), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = verifyEmailToken(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await User.findByIdAndUpdate(payload.userId, { isVerified: true });

    return new Response(JSON.stringify({ message: "Email verified successfully" }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Verification failed" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
