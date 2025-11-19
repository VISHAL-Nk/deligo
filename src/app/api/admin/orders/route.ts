import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Orders.models";
import Admin from "@/models/Admins.models";

// GET /api/admin/orders - Get all orders
export async function GET(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check if user is admin
    const admin = await Admin.findOne({ userId: session.user.id });
    if (!admin) {
      return NextResponse.json(
        { error: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    // Get orders
    const orders = await Order.find(query)
      .populate({
        path: "userId",
        select: "name email phone",
      })
      .populate({
        path: "sellerId",
        select: "businessName contactEmail",
      })
      .populate({
        path: "items.productId",
        select: "name images price",
      })
      .populate({
        path: "shipmentId",
        select: "trackingNumber status deliveryPersonId",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    // Get statistics
    const stats = {
      total: await Order.countDocuments(),
      pending: await Order.countDocuments({ status: "pending" }),
      confirmed: await Order.countDocuments({ status: "confirmed" }),
      packed: await Order.countDocuments({ status: "packed" }),
      shipped: await Order.countDocuments({ status: "shipped" }),
      delivered: await Order.countDocuments({ status: "delivered" }),
      cancelled: await Order.countDocuments({ status: "cancelled" }),
    };

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
