import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import Order from "@/models/Orders.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import { generateOTP, generateTrackingNumber } from "@/lib/delivery-utils";

// POST /api/admin/shipments - Create shipment
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, deliveryPersonId } = body;

    // Get order details
    const order = await Order.findById(orderId).populate("shippingAddress");

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({ orderId });
    if (existingShipment) {
      return NextResponse.json(
        { success: false, message: "Shipment already exists for this order" },
        { status: 400 }
      );
    }

    // Generate OTP and tracking number
    const otpCode = generateOTP();
    const trackingNumber = generateTrackingNumber();

    // Create shipment
    const shipment = await Shipment.create({
      orderId,
      deliveryPersonId: deliveryPersonId || null,
      trackingNumber,
      otpCode,
      status: deliveryPersonId ? "assigned" : "pending",
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      deliveryAddress: order.shippingAddress,
      customerName: order.userId?.name || "Customer",
      customerPhone: order.userId?.phone || "",
      events: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Shipment created",
        },
      ],
    });

    // If assigned to driver, update their profile
    if (deliveryPersonId) {
      await DeliveryProfile.findByIdAndUpdate(deliveryPersonId, {
        $push: { currentAssignments: shipment._id },
        $inc: { totalDeliveries: 1 },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully",
        data: shipment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create shipment",
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/shipments - List all shipments
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const shipments = await Shipment.find(query)
      .populate({
        path: "deliveryPersonId",
        select: "userId vehicleType region",
        populate: { path: "userId", select: "name email" },
      })
      .populate({
        path: "orderId",
        select: "orderNumber totalAmount userId",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Shipment.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: {
          shipments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch shipments",
      },
      { status: 500 }
    );
  }
}
