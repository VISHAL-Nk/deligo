import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Wishlist from "@/models/Wishlist.models";

// PATCH - Toggle price alert for a product
export async function PATCH(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    const { productId, enabled } = await request.json();

    if (!productId || typeof enabled !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Product ID and enabled status required" }), 
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await Wishlist.findOneAndUpdate(
      { userId: session.user.id, "products.productId": productId },
      {
        $set: { 
          "products.$.priceAlertEnabled": enabled,
          "products.$.notifiedAt": enabled ? null : undefined,
        },
      },
      { new: true }
    );

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Product not in wishlist" }), 
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: enabled ? "Price alert enabled" : "Price alert disabled",
        priceAlertEnabled: enabled,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/wishlist/price-alert error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// GET - Get products with price drops
export async function GET() {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    await dbConnect();

    const wishlist = await Wishlist.findOne({ userId: session.user.id })
      .populate({
        path: "products.productId",
        select: "_id name price discount images stock",
        match: { status: "active" },
      })
      .lean();

    // Define the populated wishlist type
    interface PopulatedWishlist {
      products: Array<{
        productId: {
          _id: string;
          name: string;
          price: number;
          discount: number;
          images: string[];
          stock: number;
        } | null;
        priceAtAdd: number;
        priceAlertEnabled: boolean;
      }>;
    }
    
    const typedWishlist = wishlist as unknown as PopulatedWishlist | null;

    if (!typedWishlist || !typedWishlist.products) {
      return new Response(JSON.stringify({ products: [] }), { status: 200 });
    }

    // Filter products with price drops
    const priceDropProducts = typedWishlist.products
      .filter((item) => {
        if (!item.productId) return false;
        const currentPrice = item.productId.price - item.productId.discount;
        return currentPrice < item.priceAtAdd;
      })
      .map((item) => {
        const currentPrice = item.productId!.price - item.productId!.discount;
        return {
          ...item,
          currentPrice,
          originalPrice: item.priceAtAdd,
          savings: item.priceAtAdd - currentPrice,
          savingsPercent: Math.round(
            ((item.priceAtAdd - currentPrice) / item.priceAtAdd) * 100
          ),
        };
      });

    return new Response(
      JSON.stringify({
        products: priceDropProducts,
        count: priceDropProducts.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/wishlist/price-alert error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
