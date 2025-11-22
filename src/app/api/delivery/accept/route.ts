import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import Notification from "@/models/Notifications.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// Accept an available (unassigned) shipment
export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shipmentId } = await req.json();

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 }
      );
    }

    // Find the shipment
    const shipment = await Shipment.findById(shipmentId).populate("orderId");
    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Check if shipment is available for acceptance
    if (shipment.status !== "pending") {
      return NextResponse.json(
        { error: "Shipment is not available for acceptance" },
        { status: 400 }
      );
    }

    // Check if already assigned to someone
    if (shipment.deliveryPersonId) {
      return NextResponse.json(
        { error: "Shipment is already assigned to another delivery person" },
        { status: 400 }
      );
    }

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({ 
      userId: session.user.id 
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { error: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Check if delivery profile is approved
    if (deliveryProfile.kycStatus !== "approved") {
      return NextResponse.json(
        { error: "Your delivery profile must be approved before accepting shipments" },
        { status: 400 }
      );
    }

    // Check if delivery person is active
    if (deliveryProfile.status !== "active") {
      return NextResponse.json(
        { error: "Your delivery profile is not active" },
        { status: 400 }
      );
    }

    // Assign shipment to this delivery person (use deliveryProfile._id for consistency)
    shipment.deliveryPersonId = deliveryProfile._id;
    shipment.status = "accepted"; // Set to accepted so it shows in pending deliveries
    shipment.events.push({
      status: "accepted",
      timestamp: new Date(),
      note: `Accepted by delivery person ${deliveryProfile.firstName} ${deliveryProfile.lastName}`
    });

    await shipment.save();

    // Update delivery profile - set online/available and add to assignments
    await DeliveryProfile.findByIdAndUpdate(deliveryProfile._id, {
      $push: { currentAssignments: shipment._id },
      $inc: { totalDeliveries: 1 },
      isOnline: true,
      isAvailable: true
    });

    // Create notification for customer
    const order = shipment.orderId as { _id: { toString: () => string }; userId?: string; sellerId?: string };
    if (order?.userId) {
      await Notification.create({
        userId: order.userId,
        message: `A delivery person has been assigned to your order ${order._id.toString().slice(-6)}`,
        type: "order",
        isRead: false
      });
    }

    // Create notification for seller
    if (order?.sellerId) {
      await Notification.create({
        userId: order.sellerId,
        message: `Order ${order._id.toString().slice(-6)} has been assigned to a delivery person`,
        type: "order",
        isRead: false
      });
    }

    return NextResponse.json({
      success: true,
      message: "Shipment accepted successfully",
      shipment: {
        _id: shipment._id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        pickupAddress: shipment.pickupAddress,
        deliveryAddress: shipment.deliveryAddress,
        otpCode: shipment.otpCode
      }
    });

  } catch (error) {
    console.error("Accept shipment error:", error);
    return NextResponse.json(
      { error: "Failed to accept shipment" },
      { status: 500 }
    );
  }
}
