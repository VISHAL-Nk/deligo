// src/app/api/auth/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect, dbDisconnect } from "@/lib/db";
import User from "@/models/User.models";
import UserProfile from "@/models/UserProfiles.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { profileSchema, ProfileType } from "@/schema/profileSchema";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      { hasProfile: user.hasProfile || false },
      { status: 200 },
    );
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if user already has a profile and redirect if they do
    if (user.hasProfile) {
      return NextResponse.json(
        {
          message: "Profile already exists. Redirecting to products.",
          redirect: "/products",
        },
        { status: 200 },
      );
    }

    const body = await req.json();
    const parseResult = profileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues },
        { status: 400 },
      );
    }

    const { fullName, phone, gender, dateOfBirth } =
      parseResult.data as ProfileType;

    const existingUserProfile = await UserProfile.findOne({ userId: user._id });

    if (existingUserProfile) {
      // Update existing profile
      existingUserProfile.fullName = fullName;
      existingUserProfile.phone = phone;
      existingUserProfile.gender = gender;
      existingUserProfile.dateOfBirth = dateOfBirth;
      await existingUserProfile.save();
    } else {
      // Create new profile
      await UserProfile.create({
        userId: user._id,
        fullName,
        phone,
        gender,
        dateOfBirth,
        addresses: [],
        preferences: {},
      });
    }

    // Update user hasProfile status
    await User.findByIdAndUpdate(user._id, { hasProfile: true });

    console.log("Profile created/updated and user hasProfile set to true");

    return NextResponse.json(
      {
        message: "Profile completed successfully.",
        redirect: "/products",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Profile Route Error:", error);

    return NextResponse.json(
      {
        error: "An unexpected server error occurred. Please try again later.",
      },
      { status: 500 },
    );
  } finally {
    await dbDisconnect();
  }
}
