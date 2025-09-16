import { dbConnect, dbDisconnect } from "@/lib/db";
import Product from "@/models/Products.models";
import { getServerSession } from "next-auth";
import { type NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export default async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const query = searchParams.get("q") || "";
    const session = await getServerSession(authOptions);
    if(!session || !session.user){
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if(!query){
      return new Response(JSON.stringify({ error: "Query parameter 'q' is required." }), {
        status: 400,
      });
    }

    await dbConnect();
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    if(!products){
      return new Response(JSON.stringify({ error: "No products found." }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Products Search Route Error:", error.message, {
        stack: error.stack,
      });
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  } finally {
    await dbDisconnect();
  }
}
