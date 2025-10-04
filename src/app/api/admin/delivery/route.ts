// src/app/api/admin/delivery/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import { Session } from "@/lib/Session";

export async function GET(req: NextRequest) {
  try {
    const session = await Session();
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = {};
    if (status && status !== "all") {
      query = { kycStatus: status };
    }

    const deliveryPartners = await DeliveryProfile.find(query).populate("userId", "-passwordHash").lean();

    return NextResponse.json({
      success: true,
      deliveryPartners,
    });
  } catch (error) {
    console.error("Error fetching delivery partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery partners" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await Session();
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { deliveryId, action } = body;

    await dbConnect();

    const delivery = await DeliveryProfile.findById(deliveryId);
    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery partner not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      delivery.kycStatus = "approved";
      delivery.status = "active";
    } else if (action === "reject") {
      delivery.kycStatus = "rejected";
      delivery.status = "inactive";
    }

    await delivery.save();

    return NextResponse.json({
      success: true,
      message: `Delivery partner ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error updating delivery partner:", error);
    return NextResponse.json(
      { error: "Failed to update delivery partner" },
      { status: 500 }
    );
  }
}
