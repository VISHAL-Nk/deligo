// src/app/api/search/route.ts

import { dbConnect, dbDisconnect } from "@/lib/db";
import Product from "@/models/Products.models";
import { type NextRequest } from "next/server";
// import { Session } from "@/lib/Session";

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    // Support both 'query' and 'search' parameters for flexibility
    const query = searchParams.get("query") || searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Uncomment if you want to require authentication
    // const session = await Session();
    // if(!session || !session.user){
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), {
    //     status: 401,
    //   });
    // }

    if (!query) {
      return new Response(JSON.stringify({ 
        error: "Query parameter 'query' or 'search' is required.",
        products: [],
        totalProducts: 0,
        currentPage: page,
        totalPages: 0
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await dbConnect();

    // Build search criteria
    interface SearchCriteria {
      $or: Array<{ [key: string]: { $regex: string; $options: string } }>;
      category?: { $regex: string; $options: string };
    }

    const searchCriteria: SearchCriteria = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    // Add category filter if provided
    if (category) {
      searchCriteria.category = { $regex: category, $options: "i" };
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(searchCriteria);

    // Build sort object
    const sortObject: Record<string, 1 | -1> = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute search with pagination
    const products = await Product.find(searchCriteria)
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    return new Response(JSON.stringify({
      products,
      totalProducts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Products Search Route Error:", error.message, {
        stack: error.stack,
      });
    }
    return new Response(JSON.stringify({ 
      error: errorMessage,
      products: [],
      totalProducts: 0,
      currentPage: 1,
      totalPages: 0
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await dbDisconnect();
  }
}