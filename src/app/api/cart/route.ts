import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Cart from "@/models/Cart.models";

export  async function GET() {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    await dbConnect();

    // Fetch cart items for the authenticated user
    const cartItems = await Cart.find({ userId: session.user.id });
    return new Response(JSON.stringify(cartItems), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(message, { status: 500 });
  }
}
