import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// PATCH /api/delivery/shipments/[id]/status - Update shipment status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const body = await req.json();
    const { status, location, note } = body;

    // Validate status
    const validStatuses = [
      "accepted",
      "picked_up",
      "in-transit",
      "delivered",
      "failed",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
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

    // Get shipment
    const shipment = await Shipment.findById(id);

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify shipment is assigned to this driver
    if (shipment.deliveryPersonId?.toString() !== deliveryProfile._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Not authorized for this shipment" },
        { status: 403 }
      );
    }

    // Update shipment status
    shipment.status = status;

    // Add event to history
    shipment.events = shipment.events || [];
    shipment.events.push({
      status,
      timestamp: new Date(),
      location: location || shipment.currentLocation,
      note: note || "",
    });

    // Update location if provided
    if (location && location.lat && location.lng) {
      shipment.currentLocation = {
        lat: location.lat,
        lng: location.lng,
      };
    }

    // Update specific timestamps
    if (status === "picked_up") {
      shipment.pickupTime = new Date();
    } else if (status === "delivered") {
      shipment.deliveredTime = new Date();
    }

    await shipment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully",
        data: shipment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update status",
      },
      { status: 500 }
    );
  }
}
