import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import DriverEarnings from "@/models/DriverEarnings.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// GET /api/delivery/earnings - Get driver earnings
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    const query: Record<string, unknown> = {
      deliveryPersonId: deliveryProfile._id,
    };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      const dateQuery: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.$lte = new Date(endDate);
      }
      query.earnedAt = dateQuery;
    }

    // Fetch earnings
    const earnings = await DriverEarnings.find(query)
      .populate({
        path: "shipmentId",
        select: "trackingNumber status deliveredTime",
      })
      .populate({
        path: "orderId",
        select: "orderNumber",
      })
      .sort({ earnedAt: -1 })
      .limit(100);

    // Calculate summary
    const summary = {
      totalEarnings: deliveryProfile.earnings.total,
      pendingEarnings: deliveryProfile.earnings.pending,
      paidEarnings: deliveryProfile.earnings.paid,
      totalDeliveries: deliveryProfile.totalDeliveries,
      completedDeliveries: deliveryProfile.completedDeliveries,
    };

    // Calculate period statistics
    const periodStats = await DriverEarnings.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          netAmount: { $sum: "$netAmount" },
          count: { $sum: 1 },
          avgEarning: { $avg: "$netAmount" },
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          earnings,
          summary,
          periodStats: periodStats[0] || {
            totalAmount: 0,
            netAmount: 0,
            count: 0,
            avgEarning: 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch earnings",
      },
      { status: 500 }
    );
  }
}
