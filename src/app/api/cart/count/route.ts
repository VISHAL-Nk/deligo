// src/app/api/cart/count/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Cart from "@/models/Cart.models";
import { Session } from "@/lib/Session";

// GET - Get cart item count
export async function GET() {
  try {
    const session = await Session();

    if (!session?.user) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId: session.user.id })
      .populate({
        path: 'items.productId',
        select: '_id status'
      })
      .lean() as { items?: { productId: { status?: string } | null; quantity: number }[] } | null;
    
    if (!cart || !cart.items) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Sum up quantities only for items with valid products
    const totalCount = cart.items
      .filter(item => item.productId !== null && (!item.productId.status || item.productId.status === 'active'))
      .reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);

    return NextResponse.json({ count: totalCount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart count:", error);
    return NextResponse.json({ count: 0 }, { status: 200 }); // Return 0 on error
  }
}
