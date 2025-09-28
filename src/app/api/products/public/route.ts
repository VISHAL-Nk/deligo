// src/app/api/products/public/route.ts
import { dbConnect } from "@/lib/db";
import Product from "@/models/Products.models";

export async function GET() {
  try {
    await dbConnect();

    // Get public products (you might want to add conditions like status: 'active')
    const products = await Product.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(20); // Limit for homepage

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