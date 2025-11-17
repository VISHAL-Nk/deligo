import { NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import DeliveryProfile from "@/models/DeliveryProfiles.models";

// Toggle delivery person online/offline status
export async function PATCH(req: Request) {
  try {
    const session = await Session();
    if (!session?.user?.id || session.user.role !== "delivery") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { isOnline, location } = await req.json();

    const deliveryProfile = await DeliveryProfile.findOne({ 
      userId: session.user.id 
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { error: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Check if KYC is approved
    if (deliveryProfile.kycStatus !== "approved") {
      return NextResponse.json(
        { error: "Your KYC must be approved before going online" },
        { status: 403 }
      );
    }

    // Update online status
    deliveryProfile.isOnline = isOnline;
    deliveryProfile.isAvailable = isOnline; // When going online, set available too
    
    // Update last location if provided
    if (location && location.lat && location.lng) {
      deliveryProfile.lastLocation = {
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date()
      };
    }

    await deliveryProfile.save();

    return NextResponse.json({
      success: true,
      isOnline: deliveryProfile.isOnline,
      isAvailable: deliveryProfile.isAvailable,
      message: isOnline ? "You are now online and available for deliveries" : "You are now offline"
    });

  } catch (error) {
    console.error("Availability toggle error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update availability" },
      { status: 500 }
    );
  }
}

// Get current availability status
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

    return NextResponse.json({
      isOnline: deliveryProfile.isOnline,
      isAvailable: deliveryProfile.isAvailable,
      kycStatus: deliveryProfile.kycStatus,
      currentAssignments: deliveryProfile.currentAssignments,
      lastLocation: deliveryProfile.lastLocation
    });

  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get availability" },
      { status: 500 }
    );
  }
}
