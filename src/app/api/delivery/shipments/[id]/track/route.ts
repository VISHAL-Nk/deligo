import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// POST /api/delivery/shipments/[id]/track - Update location
export async function POST(
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
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, message: "Location coordinates required" },
        { status: 400 }
      );
    }

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({
      userId: session.user.id,
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

    // Update current location
    shipment.currentLocation = { lat, lng };
    await shipment.save();

    // Also update driver's last location
    deliveryProfile.lastLocation = {
      lat,
      lng,
      timestamp: new Date(),
    };
    await deliveryProfile.save();

    return NextResponse.json(
      {
        success: true,
        message: "Location updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update location",
      },
      { status: 500 }
    );
  }
}
