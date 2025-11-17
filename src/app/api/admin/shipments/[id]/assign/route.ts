import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// PATCH /api/admin/shipments/[id]/assign - Assign driver to shipment
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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { deliveryPersonId } = body;

    // Get shipment
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findById(deliveryPersonId);
    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Check if driver is available
    if (!deliveryProfile.isAvailable || deliveryProfile.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Delivery partner is not available" },
        { status: 400 }
      );
    }

    // Remove from previous driver if assigned
    if (shipment.deliveryPersonId) {
      await DeliveryProfile.findByIdAndUpdate(shipment.deliveryPersonId, {
        $pull: { currentAssignments: shipment._id },
      });
    }

    // Assign to new driver
    shipment.deliveryPersonId = deliveryPersonId;
    shipment.status = "assigned";
    shipment.events = shipment.events || [];
    shipment.events.push({
      status: "assigned",
      timestamp: new Date(),
      note: `Assigned to ${deliveryProfile.userId}`,
    });
    await shipment.save();

    // Update driver profile
    await DeliveryProfile.findByIdAndUpdate(deliveryPersonId, {
      $addToSet: { currentAssignments: shipment._id },
      $inc: { totalDeliveries: 1 },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shipment assigned successfully",
        data: shipment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error assigning shipment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to assign shipment",
      },
      { status: 500 }
    );
  }
}
