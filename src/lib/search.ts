/**
 * Deligo Search Client
 * 
 * Client library for interacting with the Python Search Server.
 * Provides type-safe search, autocomplete, and indexing functions.
 */

// ============ Types ============

export interface SearchOptions {
  page?: number;
  limit?: number;
  categoryId?: string;
  categoryName?: string;
  sellerId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  hasDiscount?: boolean;
  sortBy?: 'relevance' | 'price' | 'created_at' | 'order_count' | 'view_count' | 'rating' | 'discount';
  sortOrder?: 'asc' | 'desc';
  highlight?: boolean;
  showFacets?: boolean;
}

export interface ProductResult {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  discount: number;
  discounted_price?: number;
  images: string[];
  category_id: string;
  category_name?: string;
  seller_id: string;
  seller_name?: string;
  stock: number;
  in_stock: boolean;
  rating?: number;
  review_count: number;
  order_count: number;
  status: string;
  sku: string;
  created_at?: string;
  _formatted?: {
    name?: string;
    description?: string;
  };
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface FacetGroup {
  name: string;
  display_name: string;
  values: FacetValue[];
}

export interface SearchResponse {
  query: string;
  products: ProductResult[];
  total_hits: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
  processing_time_ms: number;
  facets?: FacetGroup[];
  query_corrected?: string;
  suggestions?: string[];
}

export interface AutocompleteProduct {
  id: string;
  name: string;
  image?: string;
  price: number;
  category_name?: string;
}

export interface AutocompleteCategory {
  id: string;
  name: string;
  product_count: number;
}

export interface AutocompleteResponse {
  query: string;
  products: AutocompleteProduct[];
  categories: AutocompleteCategory[];
  suggestions: string[];
  processing_time_ms: number;
}

export interface IndexProductData {
  id: string;
  seller_id: string;
  sku: string;
  name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  price: number;
  currency?: string;
  discount?: number;
  images?: string[];
  stock?: number;
  status?: 'active' | 'draft' | 'banned' | 'deleted';
  rating?: number;
  review_count?: number;
  order_count?: number;
  view_count?: number;
  seller_name?: string;
  variant_values?: string[];
  seo_tags?: string[];
}

export interface IndexResponse {
  success: boolean;
  message: string;
  indexed_count?: number;
  failed_count?: number;
  task_uid?: number;
  errors?: string[];
}

export interface IndexStats {
  total_products: number;
  indexed_at?: string;
  last_update?: string;
  index_size_bytes?: number;
  is_indexing: boolean;
}

export interface HealthResponse {
  status: string;
  meilisearch_status: string;
  mongodb_status: string;
  timestamp: string;
  version: string;
}

export interface AnalyticsData {
  total_searches: number;
  unique_queries: number;
  avg_results_per_query: number;
  top_queries: Array<{ query: string; count: number }>;
  zero_result_queries: string[];
  popular_categories: Array<{ category: string; count: number }>;
  search_trends: Array<{ timestamp: string; count: number }>;
  period: string;
}

// ============ Configuration ============

const SEARCH_SERVER_URL = process.env.SEARCH_SERVER_URL || process.env.NEXT_PUBLIC_SEARCH_SERVER_URL || 'http://localhost:8001';

/**
 * Check if the search server is configured
 */
export function isSearchServerConfigured(): boolean {
  return !!process.env.SEARCH_SERVER_URL || !!process.env.NEXT_PUBLIC_SEARCH_SERVER_URL;
}

// ============ Search Functions ============

/**
 * Search for products using the search server.
 * Falls back to standard API if search server is unavailable.
 */
export async function searchProducts(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/search`, {
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
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Search server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search server error:', error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions for a partial query.
 */
export async function getAutocomplete(
  query: string,
  limit: number = 10
): Promise<AutocompleteResponse> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${SEARCH_SERVER_URL}/autocomplete?${params}`, {
      signal: AbortSignal.timeout(2000), // Shorter timeout for autocomplete
    });

    if (!response.ok) {
      throw new Error(`Autocomplete error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Autocomplete error:', error);
    throw error;
  }
}

/**
 * Get search suggestions (alias for autocomplete).
 */
export async function getSuggestions(
  query: string,
  limit: number = 10
): Promise<AutocompleteResponse> {
  return getAutocomplete(query, limit);
}

// ============ Indexing Functions ============

/**
 * Index or update a single product in the search index.
 * Call this after creating or updating a product.
 */
export async function indexProduct(product: IndexProductData): Promise<IndexResponse> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/index/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Index failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Index product error:', error);
    throw error;
  }
}

/**
 * Bulk index multiple products.
 */
export async function bulkIndexProducts(products: IndexProductData[]): Promise<IndexResponse> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/index/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Bulk index failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Bulk index error:', error);
    throw error;
  }
}

/**
 * Remove a product from the search index.
 * Call this when a product is deleted.
 */
export async function removeProductFromIndex(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/index/product/${productId}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Remove from index error:', error);
    return false;
  }
}

/**
 * Trigger a full reindex of all products.
 * Use sparingly - runs in background on the server.
 */
export async function triggerFullReindex(): Promise<IndexResponse> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/index/reindex`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Reindex trigger failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Reindex error:', error);
    throw error;
  }
}

/**
 * Get index statistics.
 */
export async function getIndexStats(): Promise<IndexStats> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/index/stats`);

    if (!response.ok) {
      throw new Error('Failed to get index stats');
    }

    return await response.json();
  } catch (error) {
    console.error('Index stats error:', error);
    throw error;
  }
}

// ============ Analytics Functions ============

/**
 * Track a search result click for analytics.
 */
export async function trackSearchClick(
  query: string,
  productId: string,
  position: number,
  userId?: string,
  sessionId?: string
): Promise<void> {
  try {
    const params = new URLSearchParams({
      query,
      product_id: productId,
      position: position.toString(),
    });

    if (userId) params.append('user_id', userId);
    if (sessionId) params.append('session_id', sessionId);

    await fetch(`${SEARCH_SERVER_URL}/analytics/track-click?${params}`, {
      method: 'POST',
    });
  } catch (error) {
    // Don't throw - analytics tracking is non-critical
    console.error('Track click error:', error);
  }
}

/**
 * Get search analytics data.
 */
export async function getSearchAnalytics(
  period: 'last_24h' | 'last_7d' | 'last_30d' = 'last_24h'
): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/analytics?period=${period}`);

    if (!response.ok) {
      throw new Error('Failed to get analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
}

// ============ Health Check ============

/**
 * Check if the search server is healthy.
 */
export async function checkSearchServerHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${SEARCH_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return null;
  }
}

/**
 * Check if search server is available (quick check).
 */
export async function isSearchServerAvailable(): Promise<boolean> {
  const health = await checkSearchServerHealth();
  return health?.status === 'healthy';
}

// ============ Helper Functions ============

/**
 * Convert search server response to legacy format for backward compatibility.
 */
export function convertToLegacyFormat(response: SearchResponse): {
  products: ProductResult[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  return {
    products: response.products,
    totalProducts: response.total_hits,
    currentPage: response.page,
    totalPages: response.total_pages,
    hasNextPage: response.has_next_page,
    hasPrevPage: response.has_prev_page,
  };
}

/**
 * Get highlighted text from search results.
 */
export function getHighlightedText(
  product: ProductResult,
  field: 'name' | 'description'
): string {
  if (product._formatted?.[field]) {
    return product._formatted[field]!;
  }
  return field === 'name' ? product.name : (product.description || '');
}

/**
 * Calculate discounted price.
 */
export function getDiscountedPrice(product: ProductResult): number {
  if (product.discounted_price) {
    return product.discounted_price;
  }
  if (product.discount > 0) {
    return product.price * (1 - product.discount / 100);
  }
  return product.price;
}

// Export default search function
export default searchProducts;
