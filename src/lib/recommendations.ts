/**
 * Deligo Recommendation Engine - Next.js Client Library
 * 
 * Provides type-safe functions for interacting with the recommendation
 * microservice from the Next.js application.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendationItem {
  product_id: string;
  score: number;
  source: 'user_behavior' | 'product_similarity' | 'co_purchase' | 'popularity' | 'trending' | string;
  explanation: string;
  scores?: {
    collaborative: number;
    content: number;
    popularity: number;
  };
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: RecommendationItem[];
  count: number;
  type: 'personalized' | 'similar_products' | 'customers_also_bought' | 'trending';
  timestamp: string;
  user_id?: string;
  source_product_id?: string;
  region?: string;
  error?: string;
}

export interface TrainingResponse {
  success: boolean;
  message: string;
  timestamp: string;
  duration_seconds?: number;
  data_stats?: Record<string, number>;
  models?: Record<string, unknown>;
  error?: string;
}

export interface ServiceStatus {
  service: string;
  is_ready: boolean;
  models_loaded_at: string | null;
  models: {
    collaborative: { loaded: boolean; trained: boolean; info: unknown };
    content_based: { loaded: boolean; trained: boolean; info: unknown };
    hybrid: { loaded: boolean; trained: boolean; info: unknown };
  };
  cache: {
    size: number;
    max_size: number;
    ttl_seconds: number;
  };
}

export interface RecommendationOptions {
  /** Number of recommendations to return (default: 10) */
  n?: number;
  /** Filter by category ID */
  category?: string;
  /** Region code for trending recommendations */
  region?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const RECOMMENDATION_SERVER_URL = process.env.RECOMMENDATION_SERVER_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 5000; // 5 seconds

/**
 * Check if the recommendation server URL is configured.
 */
export function isRecommendationServerConfigured(): boolean {
  return Boolean(process.env.RECOMMENDATION_SERVER_URL);
}

// ============================================================================
// HTTP UTILITIES
// ============================================================================

/**
 * Make a request to the recommendation server with timeout and error handling.
 */
async function fetchFromRecommendationServer<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${RECOMMENDATION_SERVER_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Recommendation server request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// RECOMMENDATION API FUNCTIONS
// ============================================================================

/**
 * Get personalized recommendations for a user.
 * 
 * Uses the user's browsing and purchase history to generate personalized
 * product recommendations.
 * 
 * @param userId - User identifier
 * @param options - Optional parameters (n, category)
 * @returns Recommendation response with personalized products
 * 
 * @example
 * ```ts
 * const recs = await getPersonalizedRecommendations(userId);
 * recs.recommendations.forEach(rec => {
 *   console.log(`Product: ${rec.product_id}, Score: ${rec.score}`);
 * });
 * ```
 */
export async function getPersonalizedRecommendations(
  userId: string,
  options: RecommendationOptions = {}
): Promise<RecommendationResponse> {
  const params = new URLSearchParams({
    user_id: userId,
    n: String(options.n || 10),
  });

  if (options.category) {
    params.append('category', options.category);
  }

  return fetchFromRecommendationServer<RecommendationResponse>(
    `/recommend/personalized?${params.toString()}`
  );
}

/**
 * Get products similar to a given product.
 * 
 * Finds products with similar attributes using content-based filtering.
 * 
 * @param productId - Source product identifier
 * @param options - Optional parameters (n)
 * @returns Recommendation response with similar products
 * 
 * @example
 * ```ts
 * const similar = await getSimilarProducts(productId, { n: 6 });
 * ```
 */
export async function getSimilarProducts(
  productId: string,
  options: RecommendationOptions = {}
): Promise<RecommendationResponse> {
  const params = new URLSearchParams({
    product_id: productId,
    n: String(options.n || 10),
  });

  return fetchFromRecommendationServer<RecommendationResponse>(
    `/recommend/similar-products?${params.toString()}`
  );
}

/**
 * Get products frequently bought together.
 * 
 * Analyzes purchase patterns to find products commonly bought together.
 * 
 * @param productId - Source product identifier
 * @param options - Optional parameters (n)
 * @returns Recommendation response with co-purchase products
 * 
 * @example
 * ```ts
 * const alsoBought = await getCustomersAlsoBought(productId);
 * ```
 */
export async function getCustomersAlsoBought(
  productId: string,
  options: RecommendationOptions = {}
): Promise<RecommendationResponse> {
  const params = new URLSearchParams({
    product_id: productId,
    n: String(options.n || 10),
  });

  return fetchFromRecommendationServer<RecommendationResponse>(
    `/recommend/customers-also-bought?${params.toString()}`
  );
}

/**
 * Get trending products.
 * 
 * Returns products that are currently popular, optionally filtered by region.
 * 
 * @param options - Optional parameters (n, region, category)
 * @returns Recommendation response with trending products
 * 
 * @example
 * ```ts
 * // Global trending
 * const trending = await getTrendingProducts();
 * 
 * // Regional trending
 * const regionalTrending = await getTrendingProducts({ region: 'Karnataka' });
 * ```
 */
export async function getTrendingProducts(
  options: RecommendationOptions = {}
): Promise<RecommendationResponse> {
  const params = new URLSearchParams({
    n: String(options.n || 10),
  });

  if (options.region) {
    params.append('region', options.region);
  }
  if (options.category) {
    params.append('category', options.category);
  }

  return fetchFromRecommendationServer<RecommendationResponse>(
    `/recommend/trending?${params.toString()}`
  );
}

// ============================================================================
// TRAINING & MANAGEMENT API FUNCTIONS
// ============================================================================

/**
 * Trigger model retraining.
 * 
 * Starts a background training job. Check status with getTrainingStatus().
 * 
 * @param forceRetrain - Force retraining even if recent models exist
 * @param interactionDays - Only use interactions from last N days
 * @returns Training response
 */
export async function triggerTraining(
  forceRetrain = false,
  interactionDays?: number
): Promise<TrainingResponse> {
  return fetchFromRecommendationServer<TrainingResponse>('/train', {
    method: 'POST',
    body: JSON.stringify({
      force_retrain: forceRetrain,
      interaction_days: interactionDays,
    }),
  });
}

/**
 * Get current training status.
 * 
 * @returns Training status information
 */
export async function getTrainingStatus(): Promise<{
  is_training: boolean;
  last_result: TrainingResponse | null;
  models_loaded: Record<string, boolean>;
}> {
  return fetchFromRecommendationServer('/train/status');
}

/**
 * Check recommendation server health.
 * 
 * @returns True if server is healthy
 */
export async function checkRecommendationServerHealth(): Promise<boolean> {
  try {
    const response = await fetchFromRecommendationServer<{ status: string }>('/health');
    return response.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Get detailed service status.
 * 
 * @returns Service status including model info and cache stats
 */
export async function getRecommendationServiceStatus(): Promise<ServiceStatus> {
  return fetchFromRecommendationServer<ServiceStatus>('/status');
}

/**
 * Clear recommendation cache.
 * 
 * Forces fresh recommendations on subsequent requests.
 * 
 * @returns Number of cache entries cleared
 */
export async function clearRecommendationCache(): Promise<{ success: boolean; message: string }> {
  return fetchFromRecommendationServer('/cache/clear', { method: 'POST' });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get recommendations with fallback to empty array on error.
 * 
 * Safe wrapper that never throws, useful for non-critical recommendation displays.
 * 
 * @param fetcher - Async function that returns recommendations
 * @returns Recommendations array or empty array on error
 */
export async function getRecommendationsSafe<T extends RecommendationResponse>(
  fetcher: () => Promise<T>
): Promise<RecommendationItem[]> {
  try {
    const response = await fetcher();
    return response.success ? response.recommendations : [];
  } catch (error) {
    console.error('Recommendation fetch failed:', error);
    return [];
  }
}

/**
 * Extract product IDs from recommendations.
 * 
 * @param response - Recommendation response
 * @returns Array of product IDs
 */
export function extractProductIds(response: RecommendationResponse): string[] {
  return response.recommendations.map(rec => rec.product_id);
}

/**
 * Filter recommendations by minimum score.
 * 
 * @param response - Recommendation response
 * @param minScore - Minimum score threshold (0-1)
 * @returns Filtered recommendations
 */
export function filterByScore(
  response: RecommendationResponse,
  minScore: number
): RecommendationItem[] {
  return response.recommendations.filter(rec => rec.score >= minScore);
}

/**
 * Group recommendations by source.
 * 
 * @param recommendations - Array of recommendations
 * @returns Grouped recommendations by source
 */
export function groupBySource(
  recommendations: RecommendationItem[]
): Record<string, RecommendationItem[]> {
  return recommendations.reduce((acc, rec) => {
    const source = rec.source || 'unknown';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(rec);
    return acc;
  }, {} as Record<string, RecommendationItem[]>);
}

// ============================================================================
// REACT HOOKS (Optional - for client-side usage)
// ============================================================================

/**
 * Example React hook for using recommendations.
 * 
 * Note: Import this in client components only.
 * 
 * @example
 * ```tsx
 * // In a client component
 * import { usePersonalizedRecommendations } from '@/lib/recommendations';
 * 
 * function RecommendationsSection({ userId }) {
 *   const { recommendations, loading, error } = usePersonalizedRecommendations(userId);
 *   
 *   if (loading) return <Skeleton />;
 *   if (error) return <div>Failed to load recommendations</div>;
 *   
 *   return (
 *     <div>
 *       {recommendations.map(rec => (
 *         <ProductCard key={rec.product_id} productId={rec.product_id} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
// Uncomment and use in client components:
// export function usePersonalizedRecommendations(userId: string, options?: RecommendationOptions) {
//   const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);
//
//   useEffect(() => {
//     getPersonalizedRecommendations(userId, options)
//       .then(res => setRecommendations(res.recommendations))
//       .catch(setError)
//       .finally(() => setLoading(false));
//   }, [userId, options?.n, options?.category]);
//
//   return { recommendations, loading, error };
// }
