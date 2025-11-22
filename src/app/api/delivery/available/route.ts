import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// GET /api/delivery/available - Get available shipments for delivery
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

    // Check if user has delivery role
    if (session.user.role !== "delivery") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({
      userId: session.user.id,
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Check if driver is available
    if (!deliveryProfile.isAvailable) {
      return NextResponse.json(
        { success: false, message: "You are not available for deliveries. Please update your availability status." },
        { status: 403 }
      );
    }

    // Fetch available shipments (pending/unassigned)
    const availableShipments = await Shipment.find({
      $or: [
        { status: "pending", deliveryPersonId: null },
        { status: "pending", deliveryPersonId: { $exists: false } }
      ]
    })
      .populate({
        path: "orderId",
        select: "totalAmount items shippingAddress",
        populate: {
          path: "items.productId",
          select: "name images"
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(
      {
        success: true,
        data: {
          shipments: availableShipments,
          count: availableShipments.length
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching available shipments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch available shipments",
      },
      { status: 500 }
    );
  }
}
