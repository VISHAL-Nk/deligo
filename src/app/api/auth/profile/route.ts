import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import UserProfile from "@/models/UserProfiles.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { profileSchema, ProfileType } from "@/schema/profileSchema";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized. Please log in." }),
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: "User not found." }),
        { status: 404 }
      );
    }

    const userProfile = await UserProfile.findOne({ userId: user._id });
    if (!userProfile) {
      return new NextResponse(
        JSON.stringify({ error: "User profile not found." }),
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const parseResult = profileSchema.safeParse(body);
    if (!parseResult.success) {
      return new NextResponse(
        JSON.stringify({ error: parseResult.error.issues }),
        { status: 400 }
      );
    }

    const { fullName,phone,gender,dateOfBirth } = parseResult.data as ProfileType;

    userProfile.fullName = fullName;
    userProfile.phone = phone;
    userProfile.dateOfBirth = new Date(dateOfBirth);
    userProfile.gender = gender;

    await userProfile.save();

    return new NextResponse(
      JSON.stringify({ message: "Profile updated successfully." }),
      { status: 200 }
    );

  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Signup Route Error:", error.message, {
        stack: error.stack,
      });
    } else {
      console.error("Signup Route encountered a non-Error exception:", error);
    }

    return new NextResponse(
      JSON.stringify({
        error: "An unexpected server error occurred. Please try again later.",
      }),
      {
        status: 500,
      }
    );
  }
}
