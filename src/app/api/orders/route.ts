import { NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Orders.models";

// Get customer orders
export async function GET() {
  try {
    const session = await Session();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const orders = await Order.find({ userId: session.user.id })
      .populate("sellerId", "businessName")
      .populate("items.productId", "name price images")
      .populate("shipmentId")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      orders
    });

  } catch (error) {
    console.error("Get customer orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
