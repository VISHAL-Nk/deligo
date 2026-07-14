/**
 * Recommendation API Route
 * 
 * Proxies ALL requests to the Python ML Recommendation Server
 * The Python server provides:
 * - Trending: Popular products based on views/orders
 * - Personalized: ML-based (collaborative + content-based hybrid)
 * - Similar: Content-based similar products
 * - Also-bought: Collaborative filtering based on purchase patterns
 * 
 * When the ML server returns empty results (models not trained, cold start),
 * uses intelligent DB-level fallbacks that differentiate each recommendation type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';
import Order from '@/models/Orders.models';
import mongoose from 'mongoose';

const RECOMMENDATION_SERVER_URL = process.env.RECOMMENDATION_SERVER_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 8000;

interface RecommendationItem {
  product_id: string;
  score: number;
  source: string;
  explanation: string;
}

/**
 * GET /api/recommendations
 * 
 * Proxies to Python ML server endpoints:
 * - trending → /recommend/trending
 * - personalized → /recommend/personalized
 * - similar → /recommend/similar-products
 * - also-bought → /recommend/customers-also-bought
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const type = searchParams.get('type') || 'personalized';
  const userId = searchParams.get('user_id');
  const productId = searchParams.get('product_id');
  const n = parseInt(searchParams.get('n') || '10', 10);
  const category = searchParams.get('category');
  const region = searchParams.get('region');
  const realtime = searchParams.get('realtime') === 'true';

  try {
    // Map type to Python server endpoint
    const endpointMap: Record<string, string> = {
      'trending': '/recommend/trending',
      'personalized': '/recommend/personalized',
      'similar': '/recommend/similar-products',
      'also-bought': '/recommend/customers-also-bought'
    };

    const endpoint = endpointMap[type];
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: `Invalid recommendation type: ${type}` },
        { status: 400 }
      );
    }

    // Build query params for Python server
    const params = new URLSearchParams({ n: String(n) });
    if (userId) params.append('user_id', userId);
    if (productId) params.append('product_id', productId);
    if (category) params.append('category', category);
    if (region) params.append('region', region);
    if (realtime) params.append('realtime', 'true');

    // Call Python recommendation server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(
        `${RECOMMENDATION_SERVER_URL}${endpoint}?${params.toString()}`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const recs = data.recommendations || [];
        
        // If ML server returned actual recommendations, use them
        if (recs.length > 0) {
          return NextResponse.json({
            success: true,
            recommendations: recs,
            count: recs.length,
            type,
            timestamp: new Date().toISOString(),
            source: 'ml_engine'
          });
        }
        // Otherwise fall through to DB fallback
        console.log(`ML server returned empty ${type} recommendations, using DB fallback`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Python server error:', err);
    }

    // Fallback to database if Python server fails
    console.log('Falling back to database recommendations');
    return await getFallbackRecommendations(type, userId, productId, n, category);

  } catch (error) {
    console.error('Recommendation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Recommendation service error',
        recommendations: [],
        count: 0,
        type,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Fallback to database when Python server is unavailable or returns empty results.
 * Uses different strategies per recommendation type to ensure sections show distinct products.
 */
async function getFallbackRecommendations(
  type: string, 
  userId: string | null, 
  productId: string | null, 
  limit: number,
  category: string | null
) {
  await dbConnect();

  const query: Record<string, unknown> = { status: 'active', stock: { $gt: 0 } };
  if (category) {
    query.categoryId = new mongoose.Types.ObjectId(category);
  }

  let products;
  let explanationText = 'Popular product';

  switch (type) {
    case 'trending': {
      // Trending: products with highest views + orders, biased toward recency
      products = await Product.find(query)
        .sort({ viewCount: -1, orderCount: -1, updatedAt: -1 })
        .limit(limit)
        .select('_id name viewCount orderCount');
      explanationText = 'Trending based on recent activity';
      break;
    }

    case 'personalized': {
      // Personalized: try to find products based on user's past order categories,
      // otherwise pick highest-rated or most-discounted products (distinct from trending)
      if (userId) {
        try {
          // Get categories the user has ordered from
          const userOrders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('items')
            .lean();

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orderedProductIds = userOrders.flatMap((order: any) =>
            ((order.items as Array<{ productId?: mongoose.Types.ObjectId }>) || [])
              .map((item) => item.productId)
              .filter(Boolean)
          );

          if (orderedProductIds.length > 0) {
            // Get categories from ordered products
            const orderedProducts = await Product.find({ _id: { $in: orderedProductIds } })
              .select('categoryId')
              .lean();
            const categoryIds = Array.from(new Set(orderedProducts.map(
              (p: { categoryId?: mongoose.Types.ObjectId }) => p.categoryId?.toString()
            ).filter(Boolean))) as string[];

            if (categoryIds.length > 0) {
              // Recommend from same categories but different products
              const personalizedQuery = {
                ...query,
                categoryId: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) },
                _id: { $nin: orderedProductIds },
              };
              products = await Product.find(personalizedQuery)
                .sort({ orderCount: -1, viewCount: -1 })
                .limit(limit)
                .select('_id name viewCount orderCount');
              explanationText = 'Based on your purchase history';
            }
          }
        } catch (err) {
          console.error('Error building personalized fallback:', err);
        }
      }

      // If no user history or no results from categories, use a distinct sort:
      // highest discount + best rated — intentionally different from trending's viewCount sort
      if (!products || products.length === 0) {
        products = await Product.find(query)
          .sort({ discount: -1, orderCount: -1, createdAt: -1 })
          .limit(limit)
          .select('_id name viewCount orderCount');
        explanationText = 'Top picks for you';
      }
      break;
    }

    case 'similar':
    case 'also-bought': {
      // For similar / also-bought: use same category as the source product
      if (productId) {
        const product = await Product.findById(productId).select('categoryId');
        if (product?.categoryId) {
          query.categoryId = product.categoryId;
          query._id = { $ne: new mongoose.Types.ObjectId(productId) };
        }
      }
      products = await Product.find(query)
        .sort({ orderCount: -1, viewCount: -1 })
        .limit(limit)
        .select('_id name viewCount orderCount');
      explanationText = type === 'similar' ? 'Similar product' : 'Frequently bought together';
      break;
    }

    default: {
      products = await Product.find(query)
        .sort({ viewCount: -1, orderCount: -1 })
        .limit(limit)
        .select('_id name viewCount');
      break;
    }
  }

  const recommendations: RecommendationItem[] = (products || []).map((p, index) => ({
    product_id: p._id.toString(),
    score: 1 - (index * 0.1),
    source: 'database_fallback',
    explanation: explanationText
  }));

  return NextResponse.json({
    success: true,
    recommendations,
    count: recommendations.length,
    type,
    timestamp: new Date().toISOString(),
    source: 'database_fallback'
  });
}

/**
 * POST /api/recommendations/train
 * 
 * Trigger model retraining (admin only in production)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const response = await fetch(`${RECOMMENDATION_SERVER_URL}/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force_retrain: body.force_retrain || false,
        interaction_days: body.interaction_days,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Training API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trigger training' },
      { status: 503 }
    );
  }
}
