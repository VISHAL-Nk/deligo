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
    const cart = await Cart.findOne({ userId: session.user.id })
      .populate({
        path: 'items.productId',
        select: '_id name images price discount stock status'
      })
      .lean() as { items?: { productId: { status?: string; _id: unknown; name: string; images: string[]; price: number; discount: number; stock: number } | null; quantity: number }[] } | null;
    
    if (!cart) {
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    }

    // Filter out items where productId is null or product is inactive
    const validItems = cart.items?.filter((item: { productId: { status?: string } | null }) => {
      return item.productId !== null && 
             item.productId !== undefined &&
             (!item.productId.status || item.productId.status === 'active');
    }) || [];

    return new Response(JSON.stringify({ ...cart, items: validItems }), { status: 200 });
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

// DELETE - Clear entire cart
export async function DELETE() {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    await dbConnect();

    // Find and clear the cart
    const cart = await Cart.findOne({ userId: session.user.id });

    if (!cart) {
      return new Response(JSON.stringify({ message: "Cart is already empty" }), { status: 200 });
    }

    cart.items = [];
    await cart.save();

    return new Response(JSON.stringify({ message: "Cart cleared successfully" }), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
