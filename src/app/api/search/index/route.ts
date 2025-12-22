/**
 * Search Index Webhook API
 * 
 * Handles product indexing events from product create/update/delete operations.
 * This route is called internally to sync products with the search index.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  indexProduct,
  removeProductFromIndex,
  isSearchServerConfigured,
  type IndexProductData,
} from "@/lib/search";

// Verify request is from internal source or admin
async function verifyRequest(req: NextRequest): Promise<boolean> {
  // Check for internal webhook secret
  const webhookSecret = req.headers.get("x-webhook-secret");
  if (webhookSecret === process.env.SEARCH_WEBHOOK_SECRET) {
    return true;
  }

  // Check for admin session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getServerSession(authOptions as any) as any;
  if (session?.user?.role === "admin" || session?.user?.role === "seller") {
    return true;
  }

  return false;
}

/**
 * POST - Index a product
 */
export async function POST(req: NextRequest) {
  try {
    // Check if search server is configured
    if (!isSearchServerConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Search indexing skipped - server not configured",
      });
    }

    // Verify authorization
    if (!await verifyRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, product } = body;

    if (!product || !product.id) {
      return NextResponse.json({
        error: "Product data with id is required",
      }, { status: 400 });
    }

    // Handle different actions
    if (action === "delete") {
      const success = await removeProductFromIndex(product.id);
      return NextResponse.json({
        success,
        message: success ? "Product removed from index" : "Failed to remove product",
      });
    }

    // Index or update product
    const indexData: IndexProductData = {
      id: product.id || product._id?.toString(),
      seller_id: product.sellerId?.toString() || product.seller_id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category_id: product.categoryId?.toString() || product.category_id,
      category_name: product.categoryName || product.category_name,
      price: product.price,
      currency: product.currency || "INR",
      discount: product.discount || 0,
      images: product.images || [],
      stock: product.stock || 0,
      status: product.status || "active",
      rating: product.rating,
      review_count: product.reviewCount || product.review_count || 0,
      order_count: product.orderCount || product.order_count || 0,
      view_count: product.viewCount || product.view_count || 0,
      seller_name: product.sellerName || product.seller_name,
      variant_values: product.variants?.flatMap((v: { values: string[] }) => v.values),
      seo_tags: product.seo?.tags,
    };

    const result = await indexProduct(indexData);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      taskUid: result.task_uid,
    });

  } catch (error) {
    console.error("Index webhook error:", error);
    return NextResponse.json({
      error: "Indexing failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove a product from index
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!isSearchServerConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Search indexing skipped - server not configured",
      });
    }

    if (!await verifyRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({
        error: "productId is required",
      }, { status: 400 });
    }

    const success = await removeProductFromIndex(productId);

    return NextResponse.json({
      success,
      message: success ? "Product removed from index" : "Failed to remove product",
    });

  } catch (error) {
    console.error("Delete from index error:", error);
    return NextResponse.json({
      error: "Delete failed",
    }, { status: 500 });
  }
}
