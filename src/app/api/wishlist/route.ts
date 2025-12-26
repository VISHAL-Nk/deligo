import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Wishlist, { IWishlist, IWishlistItem } from "@/models/Wishlist.models";
import Product from "@/models/Products.models";
import mongoose from "mongoose";

// GET - Fetch user's wishlist
export async function GET() {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    await dbConnect();

    // Fetch wishlist with populated product details
    const wishlist = await Wishlist.findOne({ userId: session.user.id })
      .populate({
        path: "products.productId",
        select: "_id name price discount images stock status categoryId sellerId",
        match: { status: "active" }, // Only include active products
      })
      .lean();

    if (!wishlist) {
      return new Response(JSON.stringify({ products: [] }), { status: 200 });
    }

    // Define the populated product type
    interface PopulatedWishlistItem {
      productId: {
        _id: mongoose.Types.ObjectId;
        name: string;
        price: number;
        discount: number;
        images: string[];
        stock: number;
        status: string;
        categoryId: mongoose.Types.ObjectId;
        sellerId: mongoose.Types.ObjectId;
      } | null;
      addedAt: Date;
      priceAtAdd: number;
      priceAlertEnabled: boolean;
    }
    
    // Cast to the expected type after population
    const wishlistData = wishlist as unknown as { products: PopulatedWishlistItem[] };
    
    const validProducts = wishlistData.products
      .filter((item) => item.productId !== null)
      .map((item) => ({
        ...item,
        // Calculate if price has dropped
        hasPriceDrop: item.productId!.price - item.productId!.discount < item.priceAtAdd,
        currentPrice: item.productId!.price - item.productId!.discount,
        priceDifference: item.priceAtAdd - (item.productId!.price - item.productId!.discount),
      }));

    return new Response(
      JSON.stringify({
        products: validProducts,
        count: validProducts.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/wishlist error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// POST - Add product to wishlist
export async function POST(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    const { productId } = await request.json();

    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID required" }), { 
        status: 400 
      });
    }

    await dbConnect();

    // Verify product exists and is active
    const product = await Product.findOne({ 
      _id: productId, 
      status: "active" 
    }).lean() as { price: number; discount: number } | null;

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { 
        status: 404 
      });
    }

    // Calculate current price
    const currentPrice = product.price - product.discount;

    // Add to wishlist (upsert)
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: session.user.id },
      {
        $addToSet: {
          products: {
            productId,
            priceAtAdd: currentPrice,
            addedAt: new Date(),
            priceAlertEnabled: false,
          },
        },
      },
      { upsert: true, new: true }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Added to wishlist",
        count: (wishlist as IWishlist).products.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/wishlist error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// DELETE - Remove product from wishlist
export async function DELETE(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    const { productId } = await request.json();

    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID required" }), { 
        status: 400 
      });
    }

    await dbConnect();

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: session.user.id },
      {
        $pull: { products: { productId } },
      },
      { new: true }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Removed from wishlist",
        count: (wishlist as IWishlist | null)?.products?.length || 0,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/wishlist error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
