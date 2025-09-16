
import { dbConnect, dbDisconnect } from "@/lib/db";
import Product from "@/models/Products.models";

export default async function GET() {
  try {
    await dbConnect();

    const products = Product.find({}).sort({ createdAt: -1 });
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Products Route Error:", error.message, {
        stack: error.stack,
      });
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
  finally{
     await dbDisconnect(); 
  }
}
