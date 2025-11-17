import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// Get assigned shipments for delivery person
export async function GET() {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const deliveryProfile = await DeliveryProfile.findOne({ 
      userId: session.user.id 
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { error: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Get all shipments assigned to this delivery person
    const shipments = await Shipment.find({
      deliveryPersonId: session.user.id,
      status: { $in: ["assigned", "accepted", "picked_up", "in-transit"] }
    })
      .populate("orderId")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      shipments
    });

  } catch (error) {
    console.error("Get assigned shipments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned shipments" },
      { status: 500 }
    );
  }
}

// Accept or reject assigned shipment
export async function PATCH(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shipmentId, action } = await req.json();

    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    const shipment = await Shipment.findById(shipmentId);
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

    if (shipment.status !== "assigned") {
      return NextResponse.json(
        { error: "Shipment is not in assigned state" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      shipment.status = "accepted";
      shipment.events.push({
        status: "accepted",
        timestamp: new Date(),
        note: "Delivery person accepted the assignment"
      });
      await shipment.save();

      return NextResponse.json({
        success: true,
        message: "Shipment accepted"
      });

    } else {
      // Reject - unassign and make available for others
      shipment.deliveryPersonId = undefined;
      shipment.status = "pending";
      shipment.events.push({
        status: "pending",
        timestamp: new Date(),
        note: "Delivery person rejected the assignment"
      });
      await shipment.save();

      // Remove from delivery profile assignments
      await DeliveryProfile.findOneAndUpdate(
        { userId: session.user.id },
        { $pull: { currentAssignments: shipmentId } }
      );

      return NextResponse.json({
        success: true,
        message: "Shipment rejected"
      });
    }

  } catch (error) {
    console.error("Accept/reject shipment error:", error);
    return NextResponse.json(
      { error: "Failed to process shipment action" },
      { status: 500 }
    );
  }
}
