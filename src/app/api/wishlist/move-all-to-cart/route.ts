import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Wishlist, { IWishlist } from "@/models/Wishlist.models";
import Cart from "@/models/Cart.models";
import Product from "@/models/Products.models";

// POST - Move all items from wishlist to cart
export async function POST() {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    await dbConnect();

    // Get user's wishlist
    const wishlist = await Wishlist.findOne({ userId: session.user.id }) as IWishlist | null;

    if (!wishlist || wishlist.products.length === 0) {
      return new Response(
        JSON.stringify({ error: "Wishlist is empty" }), 
        { status: 400 }
      );
    }

    const productIds = wishlist.products.map((p) => p.productId);

    // Get all products with stock info
    const products = await Product.find({
      _id: { $in: productIds },
      status: "active",
      stock: { $gt: 0 },
    }).select("_id stock").lean();
    
    const typedProducts = products as unknown as Array<{ _id: { toString(): string }; stock: number }>;

    if (typedProducts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No products available to add to cart" }), 
        { status: 400 }
      );
    }

    const availableProductIds = typedProducts.map((p) => p._id.toString());
    const skippedCount = productIds.length - availableProductIds.length;

    // Get or create cart
    let cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      cart = new Cart({
        userId: session.user.id,
        items: [],
      });
    }

    // Add products to cart (skip duplicates)
    const existingCartIds = new Set(
      cart.items.map((item: { productId: { toString(): string } }) => 
        item.productId.toString()
      )
    );

    let addedCount = 0;
    for (const productId of availableProductIds) {
      if (!existingCartIds.has(productId)) {
        cart.items.push({ productId, quantity: 1 });
        addedCount++;
      }
    }

    await cart.save();

    // Clear wishlist
    await Wishlist.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { products: [] } }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `${addedCount} items moved to cart`,
        added: addedCount,
        skipped: skippedCount,
        alreadyInCart: availableProductIds.length - addedCount,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/wishlist/move-all-to-cart error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
