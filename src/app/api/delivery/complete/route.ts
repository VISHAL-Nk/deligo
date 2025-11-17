import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import Order from "@/models/Orders.models";
import Product from "@/models/Products.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import DriverEarnings from "@/models/DriverEarnings.models";
import Notification from "@/models/Notifications.models";
import { verifyOTP, calculateDeliveryEarnings, calculateDistance } from "@/lib/delivery-utils";

// Verify OTP and complete delivery
export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shipmentId, otpCode, location, signature } = await req.json();

    if (!otpCode) {
      return NextResponse.json(
        { error: "OTP code is required" },
        { status: 400 }
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
    if (shipment.deliveryPersonId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "This shipment is not assigned to you" },
        { status: 403 }
      );
    }

    if (shipment.status !== "in-transit") {
      return NextResponse.json(
        { error: "Shipment must be in-transit to complete delivery" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = verifyOTP(otpCode, shipment.otpCode || "");
    if (!isValidOTP) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 400 }
      );
    }

    // Calculate delivery earnings
    let distanceKm = 5; // Default distance
    if (shipment.pickupAddress?.coordinates && shipment.deliveryAddress?.coordinates) {
      distanceKm = calculateDistance(
        shipment.pickupAddress.coordinates.lat,
        shipment.pickupAddress.coordinates.lng,
        shipment.deliveryAddress.coordinates.lat,
        shipment.deliveryAddress.coordinates.lng
      );
    }

    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 22);
    
    const earnings = calculateDeliveryEarnings(distanceKm, isPeakHour);

    // Update shipment to delivered
    shipment.status = "delivered";
    shipment.deliveredTime = new Date();
    
    if (location?.lat && location?.lng) {
      shipment.currentLocation = {
        lat: location.lat,
        lng: location.lng
      };
    }

    shipment.proof = {
      signature: signature || "",
      images: [],
      verifiedAt: new Date()
    };

    shipment.events.push({
      status: "delivered",
      timestamp: new Date(),
      location: location,
      note: "Package delivered successfully"
    });

    await shipment.save();

    // Update order status and release reserved stock
    const order = shipment.orderId as { _id: string; userId: string; sellerId: string; items: Array<{ productId: string; quantity: number }> };
    if (order) {
      await Order.findByIdAndUpdate(order._id, {
        status: "delivered"
      });

      // Release reserved stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { reserved: -item.quantity }
        });
      }

      // Notify customer
      await Notification.create({
        userId: order.userId,
        message: `Your order ${order._id} has been delivered successfully!`,
        type: "order",
        isRead: false
      });

      // Notify seller
      await Notification.create({
        userId: order.sellerId,
        message: `Order ${order._id} has been delivered to customer`,
        type: "order",
        isRead: false
      });

      // Create driver earnings record
      await DriverEarnings.create({
        deliveryPersonId: session.user.id,
        shipmentId: shipment._id,
        orderId: order._id,
        baseAmount: earnings.baseAmount,
        distanceBonus: earnings.distanceBonus,
        peakHourBonus: earnings.peakHourBonus,
        totalAmount: earnings.totalAmount,
        platformCommission: earnings.platformCommission,
        netAmount: earnings.netAmount,
        distanceKm: distanceKm,
        isPeakHour: isPeakHour,
        status: "pending"
      });
    }

    // Update delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({ userId: session.user.id });
    if (deliveryProfile) {
      deliveryProfile.totalDeliveries = (deliveryProfile.totalDeliveries || 0) + 1;
      deliveryProfile.completedDeliveries = (deliveryProfile.completedDeliveries || 0) + 1;
      deliveryProfile.earnings.total = (deliveryProfile.earnings.total || 0) + earnings.netAmount;
      deliveryProfile.earnings.pending = (deliveryProfile.earnings.pending || 0) + earnings.netAmount;
      
      // Remove from current assignments and add to completed
      deliveryProfile.currentAssignments = deliveryProfile.currentAssignments.filter(
        (id: string) => id !== shipmentId
      );
      deliveryProfile.completedAssignments.push(shipmentId);
      
      await deliveryProfile.save();

      // Notify delivery person about earnings
      await Notification.create({
        userId: session.user.id,
        message: `Delivery completed! You earned ₹${earnings.netAmount.toFixed(2)}`,
        type: "payment",
        isRead: false
      });
    }

    return NextResponse.json({
      success: true,
      message: "Delivery completed successfully!",
      earnings: {
        totalAmount: earnings.totalAmount,
        netAmount: earnings.netAmount,
        distanceKm: distanceKm.toFixed(2),
        isPeakHour: isPeakHour
      },
      shipment: {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        deliveredTime: shipment.deliveredTime
      }
    });

  } catch (error) {
    console.error("Delivery completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete delivery" },
      { status: 500 }
    );
  }
}

// Get delivery details (for viewing OTP requirement)
export async function GET(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const shipmentId = searchParams.get("shipmentId");

    if (!shipmentId) {
      return NextResponse.json(
        { error: "Shipment ID is required" },
        { status: 400 }
      );
    }

    const shipment = await Shipment.findById(shipmentId)
      .populate("orderId")
      .populate("deliveryPersonId");

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify this shipment is assigned to this delivery person
    if (shipment.deliveryPersonId?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "This shipment is not assigned to you" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      shipment: {
        _id: shipment._id,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        customerName: shipment.customerName,
        customerPhone: shipment.customerPhone,
        deliveryAddress: shipment.deliveryAddress,
        requiresOTP: true,
        events: shipment.events
      }
    });

  } catch (error) {
    console.error("Get shipment details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment details" },
      { status: 500 }
    );
  }
}
