import { dbConnect } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Product from "@/models/Products.models";
import Review from "@/models/Reviews.models";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } },
) {
  const { productId } = params;
  try {
    const session = await getServerSession(authOptions);
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