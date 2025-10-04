// src/app/api/admin/sellers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import SellerProfile from "@/models/SellerProfiles.models";
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

    const sellers = await SellerProfile.find(query).populate("userId", "-passwordHash").lean();

    return NextResponse.json({
      success: true,
      sellers,
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers" },
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
    const { sellerId, action } = body;

    await dbConnect();

    const seller = await SellerProfile.findById(sellerId);
    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      seller.kycStatus = "approved";
    } else if (action === "reject") {
      seller.kycStatus = "rejected";
    }

    await seller.save();

    return NextResponse.json({
      success: true,
      message: `Seller ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error updating seller:", error);
    return NextResponse.json(
      { error: "Failed to update seller" },
      { status: 500 }
    );
  }
}
