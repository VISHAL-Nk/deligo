import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Wishlist from "@/models/Wishlist.models";
import Cart from "@/models/Cart.models";
import Product from "@/models/Products.models";

// POST - Move a single item from wishlist to cart
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

    // Check if product exists and has stock
    const product = await Product.findOne({
      _id: productId,
      status: "active",
    }).lean() as { stock: number; name: string } | null;

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { 
        status: 404 
      });
    }

    if (product.stock <= 0) {
      return new Response(
        JSON.stringify({ error: "Product is out of stock" }), 
        { status: 400 }
      );
    }

    // Remove from wishlist
    await Wishlist.findOneAndUpdate(
      { userId: session.user.id },
      { $pull: { products: { productId } } }
    );

    // Add to cart (or update quantity if already exists)
    const cart = await Cart.findOne({ userId: session.user.id });
    
    if (cart) {
      const existingItem = cart.items.find(
        (item: { productId: { toString(): string } }) => 
          item.productId.toString() === productId
      );

      if (existingItem) {
        // Update quantity
        await Cart.findOneAndUpdate(
          { userId: session.user.id, "items.productId": productId },
          { $inc: { "items.$.quantity": 1 } }
        );
      } else {
        // Add new item
        await Cart.findOneAndUpdate(
          { userId: session.user.id },
          { $push: { items: { productId, quantity: 1 } } }
        );
      }
    } else {
      // Create new cart
      await Cart.create({
        userId: session.user.id,
        items: [{ productId, quantity: 1 }],
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${product.name} moved to cart`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/wishlist/move-to-cart error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
