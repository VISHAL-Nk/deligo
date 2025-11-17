import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import Order from "@/models/Orders.models";
import Notification from "@/models/Notifications.models";
import { calculateDistance } from "@/lib/delivery-utils";

// Auto-assign pending shipments to available delivery persons
export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shipmentId } = await req.json();

    // Get the shipment
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    if (shipment.status !== "pending") {
      return NextResponse.json(
        { error: "Shipment is not pending" },
        { status: 400 }
      );
    }

    // Find available delivery persons
    const availableDrivers = await DeliveryProfile.find({
      isOnline: true,
      isAvailable: true,
      kycStatus: "approved",
      status: "active"
    });

    if (availableDrivers.length === 0) {
      return NextResponse.json(
        { error: "No delivery persons available at the moment" },
        { status: 404 }
      );
    }

    // Find the nearest driver based on last location
    let nearestDriver = null;
    let minDistance = Infinity;

    if (shipment.deliveryAddress?.coordinates?.lat && shipment.deliveryAddress?.coordinates?.lng) {
      for (const driver of availableDrivers) {
        if (driver.lastLocation?.lat && driver.lastLocation?.lng) {
          const distance = calculateDistance(
            driver.lastLocation.lat,
            driver.lastLocation.lng,
            shipment.deliveryAddress.coordinates.lat,
            shipment.deliveryAddress.coordinates.lng
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestDriver = driver;
          }
        }
      }
    }

    // If no driver with location, pick the first available one
    if (!nearestDriver) {
      nearestDriver = availableDrivers[0];
    }

    // Assign the shipment
    shipment.deliveryPersonId = nearestDriver.userId;
    shipment.status = "assigned";
    shipment.events.push({
      status: "assigned",
      timestamp: new Date(),
      note: `Assigned to delivery person ${nearestDriver._id}`
    });
    await shipment.save();

    // Update delivery profile
    nearestDriver.currentAssignments.push(shipmentId);
    await nearestDriver.save();

    // Update order status
    await Order.findByIdAndUpdate(shipment.orderId, {
      status: "confirmed"
    });

    // Create notification for delivery person
    await Notification.create({
      userId: nearestDriver.userId,
      message: `New delivery assigned! Tracking: ${shipment.trackingNumber}`,
      type: "order",
      isRead: false
    });

    return NextResponse.json({
      success: true,
      message: "Shipment assigned successfully",
      deliveryPersonId: nearestDriver.userId,
      trackingNumber: shipment.trackingNumber
    });

  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign shipment" },
      { status: 500 }
    );
  }
}

// Get all pending shipments (for admin/seller)
export async function GET() {
  try {
    const session = await Session();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const pendingShipments = await Shipment.find({
      status: "pending"
    })
      .populate("orderId")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      shipments: pendingShipments
    });

  } catch (error) {
    console.error("Get pending shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending shipments" },
      { status: 500 }
    );
  }
}
