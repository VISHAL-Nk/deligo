/**
 * Advanced Search API Route
 * 
 * This route proxies search requests to the Python Search Server
 * when available, falling back to MongoDB regex search otherwise.
 * 
 * Supports filters:
 * - category / categoryId: Filter by category
 * - minPrice / maxPrice: Price range filter
 * - minRating: Minimum rating filter
 * - inStock: Only show in-stock products
 * - hasDiscount: Only show discounted products
 * - sortBy: Sort field (relevance, price, createdAt, rating, popularity)
 * - sortOrder: Sort direction (asc, desc)
 */

import { type NextRequest, NextResponse } from "next/server";
import { dbConnect, dbDisconnect } from "@/lib/db";
import Product from "@/models/Products.models";
import {
  searchProducts,
  isSearchServerAvailable,
  convertToLegacyFormat,
  type SearchOptions,
} from "@/lib/search";

// Flag to track search server availability
let searchServerAvailable: boolean | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // Check every minute

async function checkSearchServer(): Promise<boolean> {
  const now = Date.now();
  if (searchServerAvailable !== null && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return searchServerAvailable;
  }

  try {
    // Direct fetch to test connection
    const response = await fetch('http://localhost:8002/health', { 
      signal: AbortSignal.timeout(3000) 
    });
    searchServerAvailable = response.ok;
    lastHealthCheck = now;
    return searchServerAvailable;
  } catch {
    searchServerAvailable = false;
    lastHealthCheck = now;
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const query = searchParams.get("query") || searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");
    const inStock = searchParams.get("inStock");
    const hasDiscount = searchParams.get("hasDiscount");

    if (!query) {
      return NextResponse.json({
        error: "Query parameter 'query' or 'search' is required.",
        products: [],
        totalProducts: 0,
        currentPage: page,
        totalPages: 0
      }, { status: 400 });
    }

    // Try to use advanced search server
    const useAdvancedSearch = await checkSearchServer();

    if (useAdvancedSearch) {
      try {
        // Build search options
        const options: SearchOptions = {
          page,
          limit,
          sortOrder: sortOrder as 'asc' | 'desc',
        };

        // Map sortBy to search server format
        const sortByMap: Record<string, SearchOptions['sortBy']> = {
          'createdAt': 'created_at',
          'price': 'price',
          'orderCount': 'order_count',
          'viewCount': 'view_count',
          'rating': 'rating',
          'popularity': 'order_count',
          'relevance': 'relevance',
        };
        options.sortBy = sortByMap[sortBy] || 'relevance';

        if (category) options.categoryName = category;
        if (categoryId) {
          // Handle multiple category IDs
          const categoryIds = categoryId.split(',').filter(Boolean);
          if (categoryIds.length > 0) {
            options.categoryId = categoryIds[0]; // Use first category for advanced search
          }
        }
        if (minPrice) options.minPrice = parseFloat(minPrice);
        if (maxPrice) options.maxPrice = parseFloat(maxPrice);
        if (minRating) options.minRating = parseFloat(minRating);
        if (inStock === 'true') options.inStock = true;
        if (hasDiscount === 'true') options.hasDiscount = true;

        // Search using advanced search server
        const searchResponse = await fetch('http://localhost:8002/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            page: options.page || 1,
            limit: options.limit || 20,
            category_id: options.categoryId,
            category_name: options.categoryName,
            seller_id: options.sellerId,
            min_price: options.minPrice,
            max_price: options.maxPrice,
            in_stock: options.inStock,
            min_rating: options.minRating,
            has_discount: options.hasDiscount,
            sort_by: options.sortBy || 'relevance',
            sort_order: options.sortOrder || 'desc',
            highlight: options.highlight ?? true,
            show_facets: options.showFacets ?? true,
          }),
        });

        if (searchResponse.ok) {
          const response = await searchResponse.json();
          
          // Convert to legacy format for backward compatibility
          const legacyResponse = convertToLegacyFormat(response);

          return NextResponse.json({
            ...legacyResponse,
            // Include additional fields from advanced search
            facets: response.facets,
            processingTimeMs: response.processing_time_ms,
            queryCorrection: response.query_corrected,
            source: 'meilisearch',
          });
        } else {
          throw new Error(`Search server returned ${searchResponse.status}`);
        }
      } catch (searchError) {
        console.error('Advanced search failed, falling back to MongoDB:', searchError);
        // Fall through to MongoDB search
      }
    }

    // Fallback: MongoDB regex search
    await dbConnect();

    interface SearchCriteria {
      $or: Array<{ [key: string]: { $regex: string; $options: string } }>;
      category?: { $regex: string; $options: string };
      categoryId?: { $in: string[] } | string;
      status?: string;
      price?: { $gte?: number; $lte?: number };
      stock?: { $gt: number };
      discount?: { $gt: number };
      rating?: { $gte: number };
    }

    const searchCriteria: SearchCriteria = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
      status: "active",
    };

    if (category) {
      searchCriteria.category = { $regex: category, $options: "i" };
    }

    if (categoryId) {
      const categoryIds = categoryId.split(',').filter(Boolean);
      if (categoryIds.length > 1) {
        searchCriteria.categoryId = { $in: categoryIds };
      } else if (categoryIds.length === 1) {
        searchCriteria.categoryId = categoryIds[0];
      }
    }

    if (minPrice || maxPrice) {
      searchCriteria.price = {};
      if (minPrice) searchCriteria.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchCriteria.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      searchCriteria.stock = { $gt: 0 };
    }

    if (hasDiscount === 'true') {
      searchCriteria.discount = { $gt: 0 };
    }

    if (minRating) {
      searchCriteria.rating = { $gte: parseFloat(minRating) };
    }

    const totalProducts = await Product.countDocuments(searchCriteria);

    // Build sort object with special handling
    const sortObject: Record<string, 1 | -1> = {};
    if (sortBy === 'popularity') {
      sortObject['orderCount'] = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === 'relevance') {
      // For relevance, sort by a combination of factors
      sortObject['orderCount'] = -1;
      sortObject['viewCount'] = -1;
    } else {
      sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    const products = await Product.find(searchCriteria)
      .populate('categoryId', 'name slug')
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform products to include category name
    const transformedProducts = products.map((product) => ({
      ...product,
      categoryName: (product.categoryId as { name?: string })?.name || 'Uncategorized',
    }));

    const totalPages = Math.ceil(totalProducts / limit);

    return NextResponse.json({
      products: transformedProducts,
      totalProducts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: 'mongodb',
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({
      error: "Search failed",
      products: [],
      totalProducts: 0,
      currentPage: 1,
      totalPages: 0
    }, { status: 500 });
  } finally {
    await dbDisconnect();
  }
}

// POST endpoint for advanced search
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, ...options } = body;

    if (!query) {
      return NextResponse.json({
        error: "Query is required",
      }, { status: 400 });
    }

    const useAdvancedSearch = await checkSearchServer();

    if (useAdvancedSearch) {
      const response = await searchProducts(query, options);
      return NextResponse.json(response);
    }

    // Convert to GET format and use fallback
    const searchParams = new URLSearchParams({ query });
    if (options.page) searchParams.set('page', options.page.toString());
    if (options.limit) searchParams.set('limit', options.limit.toString());
    if (options.categoryName) searchParams.set('category', options.categoryName);
    if (options.categoryId) searchParams.set('categoryId', options.categoryId);
    if (options.sortBy) searchParams.set('sortBy', options.sortBy);
    if (options.sortOrder) searchParams.set('sortOrder', options.sortOrder);

    const url = new URL(req.url);
    url.search = searchParams.toString();
    
    return GET(new Request(url) as unknown as NextRequest);

  } catch (error) {
    console.error("Search POST error:", error);
    return NextResponse.json({
      error: "Search failed",
    }, { status: 500 });
  }
}
