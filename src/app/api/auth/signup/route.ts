// app/api/auth/signup/route.ts
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import UserProfile from "@/models/UserProfiles.models";
import bcrypt from "bcryptjs";
import { generateEmailToken } from "@/lib/emailToken";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  await dbConnect();
  const { email, password } = await req.json();

  const existing = await User.findOne({ email });
  if (existing) {
    return new Response(JSON.stringify({ error: "Email already registered" }), {
      status: 400,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    email,
    passwordHash,
    role: "customer",
    isVerified: false,
  });

  await UserProfile.create({
    userId: newUser._id,
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: null,
    addresses: [],
    preferences: {},
  });

  // generate + send token
  const token = generateEmailToken(newUser._id.toString());
  await sendVerificationEmail(newUser.email, token);

  return new Response(
    JSON.stringify({ message: "Signup successful, check email to verify." }),
    { status: 200 }
  );
}
