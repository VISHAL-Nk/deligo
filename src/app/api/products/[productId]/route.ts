import { dbConnect } from "@/lib/db";
import Product from "@/models/Products.models";
import { Session } from "@/lib/Session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  try {
    const session = await Session();
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    await dbConnect();

    const product = await Product.findById(productId);
    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
      });
    }


    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}