import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import DriverEarnings from "@/models/DriverEarnings.models";
import DriverPayout from "@/models/DriverPayouts.models";

// GET /api/admin/delivery/analytics - Get delivery analytics
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Delivery statistics
    const totalDeliveries = await Shipment.countDocuments();
    const completedDeliveries = await Shipment.countDocuments({
      status: "delivered",
    });
    const inProgressDeliveries = await Shipment.countDocuments({
      status: { $in: ["assigned", "accepted", "picked_up", "in-transit"] },
    });
    const failedDeliveries = await Shipment.countDocuments({
      status: "failed",
    });

    // Delivery partner statistics
    const totalDrivers = await DeliveryProfile.countDocuments();
    const activeDrivers = await DeliveryProfile.countDocuments({
      status: "active",
      kycStatus: "approved",
    });
    const onlineDrivers = await DeliveryProfile.countDocuments({
      isOnline: true,
    });

    // Earnings statistics
    const totalEarningsData = await DriverEarnings.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          netAmount: { $sum: "$netAmount" },
          platformCommission: { $sum: "$platformCommission" },
        },
      },
    ]);

    const totalEarnings = totalEarningsData[0] || {
      totalAmount: 0,
      netAmount: 0,
      platformCommission: 0,
    };

    // Payout statistics
    const totalPayouts = await DriverPayout.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$netAmount" },
        },
      },
    ]);

    // Daily delivery trends (last N days)
    const deliveryTrends = await Shipment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top performing drivers
    const topDrivers = await DriverEarnings.aggregate([
      {
        $match: {
          earnedAt: { $gte: startDate },
          status: { $in: ["pending", "processed", "paid"] },
        },
      },
      {
        $group: {
          _id: "$deliveryPersonId",
          totalEarnings: { $sum: "$netAmount" },
          deliveryCount: { $sum: 1 },
          avgEarning: { $avg: "$netAmount" },
        },
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "deliveryprofiles",
          localField: "_id",
          foreignField: "_id",
          as: "driver",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "driver.userId",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);

    // Average delivery time
    const avgDeliveryTime = await Shipment.aggregate([
      {
        $match: {
          status: "delivered",
          pickupTime: { $exists: true },
          deliveredTime: { $exists: true },
        },
      },
      {
        $project: {
          deliveryDuration: {
            $subtract: ["$deliveredTime", "$pickupTime"],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: "$deliveryDuration" },
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          deliveries: {
            total: totalDeliveries,
            completed: completedDeliveries,
            inProgress: inProgressDeliveries,
            failed: failedDeliveries,
            successRate:
              totalDeliveries > 0
                ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2)
                : 0,
          },
          drivers: {
            total: totalDrivers,
            active: activeDrivers,
            online: onlineDrivers,
          },
          earnings: totalEarnings,
          payouts: totalPayouts,
          trends: deliveryTrends,
          topDrivers: topDrivers.map((d) => ({
            driverId: d._id,
            name: d.user[0]?.name || "N/A",
            totalEarnings: d.totalEarnings,
            deliveryCount: d.deliveryCount,
            avgEarning: d.avgEarning,
          })),
          avgDeliveryTime:
            avgDeliveryTime.length > 0
              ? Math.round(avgDeliveryTime[0].avgDuration / (1000 * 60)) // Convert to minutes
              : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching delivery analytics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
