import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// GET /api/delivery/assignments - Get driver's assigned shipments
export async function GET(request: NextRequest) {
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
      userId: session.user._id,
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query
    const query: Record<string, unknown> = {
      deliveryPersonId: deliveryProfile._id,
    };

    if (status) {
      query.status = status;
    }

    // Fetch assignments
    const shipments = await Shipment.find(query)
      .populate({
        path: "orderId",
        select: "orderNumber totalAmount items",
      })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get statistics
    const stats = {
      total: await Shipment.countDocuments({ deliveryPersonId: deliveryProfile._id }),
      pending: await Shipment.countDocuments({
        deliveryPersonId: deliveryProfile._id,
        status: { $in: ["assigned", "accepted"] },
      }),
      inProgress: await Shipment.countDocuments({
        deliveryPersonId: deliveryProfile._id,
        status: { $in: ["picked_up", "in-transit"] },
      }),
      completed: await Shipment.countDocuments({
        deliveryPersonId: deliveryProfile._id,
        status: "delivered",
      }),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          shipments,
          stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch assignments",
      },
      { status: 500 }
    );
  }
}
