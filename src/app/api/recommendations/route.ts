/**
 * Recommendation API Route
 * 
 * Proxies ALL requests to the Python ML Recommendation Server
 * The Python server provides:
 * - Trending: Popular products based on views/orders
 * - Personalized: ML-based (collaborative + content-based hybrid)
 * - Similar: Content-based similar products
 * - Also-bought: Collaborative filtering based on purchase patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';
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
        return NextResponse.json({
          success: true,
          recommendations: data.recommendations || [],
          count: data.recommendations?.length || 0,
          type,
          timestamp: new Date().toISOString(),
          source: 'ml_engine'
        });
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
 * Fallback to database when Python server is unavailable
 */
async function getFallbackRecommendations(
  type: string, 
  userId: string | null, 
  productId: string | null, 
  limit: number,
  category: string | null
) {
  await dbConnect();

  const query: Record<string, unknown> = { status: 'active' };
  if (category) {
    query.categoryId = new mongoose.Types.ObjectId(category);
  }

  // For similar products, get same category
  if ((type === 'similar' || type === 'also-bought') && productId) {
    const product = await Product.findById(productId).select('categoryId');
    if (product?.categoryId) {
      query.categoryId = product.categoryId;
      query._id = { $ne: new mongoose.Types.ObjectId(productId) };
    }
  }

  const products = await Product.find(query)
    .sort({ viewCount: -1, orderCount: -1 })
    .limit(limit)
    .select('_id name viewCount');

  const recommendations: RecommendationItem[] = products.map((p, index) => ({
    product_id: p._id.toString(),
    score: 1 - (index * 0.1),
    source: 'database_fallback',
    explanation: 'Popular product'
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
