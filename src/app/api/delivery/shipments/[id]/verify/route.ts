import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import DriverEarnings from "@/models/DriverEarnings.models";
import {
  verifyOTP,
  calculateDistance,
  calculateDeliveryEarnings,
  isPeakHour,
} from "@/lib/delivery-utils";

// POST /api/delivery/shipments/[id]/verify - Verify OTP and mark as delivered
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const body = await req.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "OTP code is required" },
        { status: 400 }
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

    // Get shipment
    const shipment = await Shipment.findById(id).populate("orderId");

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify shipment is assigned to this driver
    if (shipment.deliveryPersonId?.toString() !== deliveryProfile._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Not authorized for this shipment" },
        { status: 403 }
      );
    }

    // Verify OTP
    if (!verifyOTP(otp, shipment.otpCode || "")) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP code" },
        { status: 400 }
      );
    }

    // Mark as delivered
    shipment.status = "delivered";
    shipment.deliveredTime = new Date();

    // Add delivery event
    shipment.events = shipment.events || [];
    shipment.events.push({
      status: "delivered",
      timestamp: new Date(),
      location: shipment.currentLocation,
      note: "Delivery verified with OTP",
    });

    // Update proof
    if (!shipment.proof) {
      shipment.proof = {};
    }
    shipment.proof.verifiedAt = new Date();

    await shipment.save();

    // Calculate earnings
    let distanceKm = 5; // Default distance
    if (
      shipment.pickupAddress?.coordinates?.lat &&
      shipment.deliveryAddress?.coordinates?.lat
    ) {
      distanceKm = calculateDistance(
        shipment.pickupAddress.coordinates.lat,
        shipment.pickupAddress.coordinates.lng,
        shipment.deliveryAddress.coordinates.lat,
        shipment.deliveryAddress.coordinates.lng
      );
    }

    const earnings = calculateDeliveryEarnings(distanceKm, isPeakHour());

    // Create earnings record
    const driverEarning = await DriverEarnings.create({
      deliveryPersonId: deliveryProfile._id,
      shipmentId: shipment._id,
      orderId: shipment.orderId,
      baseAmount: earnings.baseAmount,
      distanceBonus: earnings.distanceBonus,
      peakHourBonus: earnings.peakHourBonus,
      totalAmount: earnings.totalAmount,
      platformCommission: earnings.platformCommission,
      netAmount: earnings.netAmount,
      status: "pending",
      earnedAt: new Date(),
    });

    // Update delivery profile earnings
    deliveryProfile.earnings.total += earnings.netAmount;
    deliveryProfile.earnings.pending += earnings.netAmount;
    deliveryProfile.completedDeliveries += 1;
    deliveryProfile.totalDeliveries += 1;
    await deliveryProfile.save();

    return NextResponse.json(
      {
        success: true,
        message: "Delivery verified successfully!",
        data: {
          shipment,
          earnings: driverEarning,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying delivery:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify delivery",
      },
      { status: 500 }
    );
  }
}
