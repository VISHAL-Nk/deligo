import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import DriverPayout from "@/models/DriverPayouts.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// GET /api/delivery/payouts - Get payout history
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

    if (session.user.role !== "delivery") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({
      userId: session.user._id,
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Fetch payouts
    const payouts = await DriverPayout.find({
      deliveryPersonId: deliveryProfile._id,
    })
      .sort({ requestedAt: -1 })
      .limit(50);

    return NextResponse.json(
      {
        success: true,
        data: payouts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payouts",
      },
      { status: 500 }
    );
  }
}

// POST /api/delivery/payouts - Request payout
export async function POST(request: NextRequest) {
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

    if (session.user.role !== "delivery") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, paymentMethod } = body;

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({
      userId: session.user._id,
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payout amount" },
        { status: 400 }
      );
    }

    // Check if driver has sufficient balance
    if (deliveryProfile.earnings.pending < amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient balance for payout",
        },
        { status: 400 }
      );
    }

    // Minimum payout amount
    const MIN_PAYOUT = 100;
    if (amount < MIN_PAYOUT) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum payout amount is ₹${MIN_PAYOUT}`,
        },
        { status: 400 }
      );
    }

    // Calculate processing fee (if any)
    const processingFee = 0; // No fee for now
    const netAmount = amount - processingFee;

    // Create payout request
    const payout = await DriverPayout.create({
      deliveryPersonId: deliveryProfile._id,
      amount,
      processingFee,
      netAmount,
      status: "pending",
      paymentMethod: paymentMethod || "bank_transfer",
      bankDetails: deliveryProfile.bankDetails,
      requestedAt: new Date(),
    });

    // Update delivery profile pending balance
    deliveryProfile.earnings.pending -= amount;
    await deliveryProfile.save();

    return NextResponse.json(
      {
        success: true,
        message: "Payout request submitted successfully",
        data: payout,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create payout request",
      },
      { status: 500 }
    );
  }
}
