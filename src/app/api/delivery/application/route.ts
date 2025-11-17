import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import { deliveryApplicationSchema } from "@/schema/deliveryApplicationSchema";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (await getServerSession(authOptions as any)) as any;

    // Check if user is logged in
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Please login to apply" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = deliveryApplicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if user already has a delivery profile
    const existingProfile = await DeliveryProfile.findOne({
      userId: session.user._id,
    });

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "You have already applied for delivery partner",
        },
        { status: 400 }
      );
    }

    // Check if license number is already in use
    const existingLicense = await DeliveryProfile.findOne({
      licenseNumber: data.licenseNumber,
    });

    if (existingLicense) {
      return NextResponse.json(
        {
          success: false,
          message: "This license number is already registered",
        },
        { status: 400 }
      );
    }

    // Create delivery profile
    const deliveryProfile = await DeliveryProfile.create({
      userId: session.user._id,
      vehicleType: data.vehicleType,
      licenseNumber: data.licenseNumber,
      region: data.region,
      kycStatus: "pending",
      status: "inactive",
      isAvailable: false,
      bankDetails: {
        accountNumber: data.accountNumber,
        ifsc: data.ifscCode,
        accountHolderName: data.accountHolderName,
      },
    });

    // Update user profile if needed
    await User.findByIdAndUpdate(session.user._id, {
      $set: {
        "profile.phone": data.phone,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Application submitted successfully! Our team will review and contact you soon.",
        data: {
          applicationId: deliveryProfile._id,
          kycStatus: deliveryProfile.kycStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in delivery application:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit application",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  await dbConnect();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (await getServerSession(authOptions as any)) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's delivery profile application status
    const deliveryProfile = await DeliveryProfile.findOne({
      userId: session.user._id,
    }).select("kycStatus status vehicleType region createdAt");

    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "No application found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: deliveryProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching delivery application:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch application",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
