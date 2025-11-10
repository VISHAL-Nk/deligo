import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Cart from "@/models/Cart.models";

// GET - Fetch cart items
export async function GET() {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    await dbConnect();

    // Fetch cart for the authenticated user and populate product details
    const cart = await Cart.findOne({ userId: session.user.id }).populate('items.productId').lean();
    
    if (!cart) {
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }

    return new Response(JSON.stringify(cart), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// POST - Add item to cart or update quantity
export async function POST(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { productId, quantity } = await request.json();

    if (!productId || quantity < 0) {
      return new Response(JSON.stringify({ error: "Invalid product or quantity" }), { status: 400 });
    }

    await dbConnect();

    // Find or create cart
    let cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      cart = new Cart({
        userId: session.user.id,
        items: []
      });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items = cart.items.filter(
        (item: { productId: { toString: () => string } }) => item.productId.toString() !== productId
      );
    } else {
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item: { productId: { toString: () => string } }) => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity = quantity;
      } else {
        // Add new item
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();

    return new Response(JSON.stringify({ message: "Cart updated", cart }), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
