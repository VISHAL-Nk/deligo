import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import Order from "@/models/Orders.models";
import Notification from "@/models/Notifications.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// Mark parcel as picked up
export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shipmentId, location } = await req.json();

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

    const shipment = await Shipment.findById(shipmentId).populate("orderId");
    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify this shipment is assigned to this delivery person
    if (shipment.deliveryPersonId?.toString() !== deliveryProfile._id.toString()) {
      return NextResponse.json(
        { error: "This shipment is not assigned to you" },
        { status: 403 }
      );
    }

    if (shipment.status !== "accepted") {
      return NextResponse.json(
        { error: "Shipment must be in 'accepted' state to pick up" },
        { status: 400 }
      );
    }

    // Update shipment status to picked_up
    shipment.status = "picked_up";
    shipment.pickupTime = new Date();
    
    if (location?.lat && location?.lng) {
      shipment.currentLocation = {
        lat: location.lat,
        lng: location.lng
      };
    }

    shipment.events.push({
      status: "picked_up",
      timestamp: new Date(),
      location: location,
      note: "Parcel picked up by delivery person"
    });

    await shipment.save();

    // Update order status to packed
    const order = shipment.orderId as { _id: string; userId: string };
    if (order) {
      await Order.findByIdAndUpdate(order._id, {
        status: "packed"
      });

      // Notify customer
      await Notification.create({
        userId: order.userId,
        message: `Your order ${order._id} has been picked up and is on the way!`,
        type: "order",
        isRead: false
      });
    }

    return NextResponse.json({
      success: true,
      message: "Parcel marked as picked up",
      shipment: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        otpCode: shipment.otpCode
      }
    });

  } catch (error) {
    console.error("Pickup error:", error);
    return NextResponse.json(
      { error: "Failed to mark parcel as picked up" },
      { status: 500 }
    );
  }
}

// Update delivery status to in-transit
export async function PATCH(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shipmentId, location } = await req.json();

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

    const shipment = await Shipment.findById(shipmentId).populate("orderId");
    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify this shipment is assigned to this delivery person
    if (shipment.deliveryPersonId?.toString() !== deliveryProfile._id.toString()) {
      return NextResponse.json(
        { error: "This shipment is not assigned to you" },
        { status: 403 }
      );
    }

    if (shipment.status !== "picked_up") {
      return NextResponse.json(
        { error: "Shipment must be picked up first" },
        { status: 400 }
      );
    }

    // Update shipment status to in-transit
    shipment.status = "in-transit";
    
    if (location?.lat && location?.lng) {
      shipment.currentLocation = {
        lat: location.lat,
        lng: location.lng
      };
    }

    shipment.events.push({
      status: "in-transit",
      timestamp: new Date(),
      location: location,
      note: "Package is in transit"
    });

    await shipment.save();

    // Update order status
    const order = shipment.orderId as { _id: string; userId: string };
    if (order) {
      await Order.findByIdAndUpdate(order._id, {
        status: "shipped"
      });

      // Notify customer
      await Notification.create({
        userId: order.userId,
        message: `Your order ${order._id} is out for delivery!`,
        type: "order",
        isRead: false
      });
    }

    return NextResponse.json({
      success: true,
      message: "Status updated to in-transit",
      shipment: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status
      }
    });

  } catch (error) {
    console.error("In-transit update error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
