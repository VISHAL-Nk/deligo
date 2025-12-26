// src/app/api/products/public/route.ts
import { dbConnect } from "@/lib/db";
import Product from "@/models/Products.models";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get("ids");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // If specific product IDs are requested (for recommendations)
    if (ids) {
      const productIds = ids.split(",").filter(Boolean);
      const products = await Product.find({
        _id: { $in: productIds },
        status: "active",
      });

      // Preserve the order of IDs (important for ranked recommendations)
      const productMap = new Map(products.map((p) => [p._id.toString(), p]));
      const orderedProducts = productIds
        .map((id) => productMap.get(id))
        .filter(Boolean);

      return new Response(JSON.stringify(orderedProducts), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get public products (you might want to add conditions like status: 'active')
    const products = await Product.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit);

    return new Response(JSON.stringify(products), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Public Products Route Error:", error.message, {
        stack: error.stack,
      });
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}