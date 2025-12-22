// src/app/api/search/suggestions/route.ts

import { dbConnect, dbDisconnect } from "@/lib/db";
import Product from "@/models/Products.models";
import { type NextRequest } from "next/server";
import { getAutocomplete, isSearchServerConfigured } from "@/lib/search";

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({
        suggestions: [],
        categories: [],
        trending: [],
        recent: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Try advanced search server first
    if (isSearchServerConfigured()) {
      try {
        const autocomplete = await getAutocomplete(query, 10);
        
        return new Response(JSON.stringify({
          suggestions: autocomplete.products.map((p, index) => ({
            id: `product_${index}`,
            text: p.name,
            type: 'product' as const,
            count: 1,
            image: p.image,
            category: p.category_name,
            price: p.price
          })),
          categories: autocomplete.categories.map((c, index) => ({
            id: `category_${index}`,
            text: c.name,
            type: 'category' as const,
            count: c.product_count
          })),
          trending: autocomplete.suggestions.map((s, index) => ({
            id: `suggestion_${index}`,
            text: s,
            type: 'trending' as const,
            count: 0
          })),
          recent: [],
          source: 'meilisearch'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (searchError) {
        console.error('Advanced autocomplete failed, falling back to MongoDB:', searchError);
        // Fall through to MongoDB
      }
    }

    // Fallback: MongoDB aggregation
    await dbConnect();

    // Get product suggestions based on name and description
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } }
          ]
        }
      },
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
          category: { $first: "$category" },
          price: { $first: "$price" },
          image: { $first: "$image" }
        }
      },
      {
        $limit: 5
      }
    ]);

    // Get category suggestions
    const categorySuggestions = await Product.aggregate([
      {
        $match: {
          category: { $regex: query, $options: "i" }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $limit: 3
      }
    ]);

    // Get trending/popular products (most recent or you can add a popularity field)
    const trendingSuggestions = await Product.aggregate([
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
          category: { $first: "$category" }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 4
      }
    ]);

    // Format the response
    const suggestions = productSuggestions.map((product, index) => ({
      id: `product_${index}`,
      text: product._id,
      type: 'product' as const,
      count: product.count,
      image: product.image,
      category: product.category,
      price: product.price
    }));

    const categories = categorySuggestions.map((cat, index) => ({
      id: `category_${index}`,
      text: cat._id,
      type: 'category' as const,
      count: cat.count
    }));

    const trending = trendingSuggestions.map((trend, index) => ({
      id: `trending_${index}`,
      text: trend._id,
      type: 'trending' as const,
      count: trend.count
    }));

    // You can implement recent searches by storing user search history
    // For now, returning empty array
    const recent: Array<{
      id: string;
      text: string;
      type: 'recent';
      count?: number;
    }> = [];

    return new Response(JSON.stringify({
      suggestions,
      categories,
      trending,
      recent
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Search Suggestions Route Error:", error.message, {
        stack: error.stack,
      });
    }
    return new Response(JSON.stringify({ 
      error: errorMessage,
      suggestions: [],
      categories: [],
      trending: [],
      recent: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await dbDisconnect();
  }
}