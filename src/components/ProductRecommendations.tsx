/**
 * Product Recommendations Component
 * 
 * Reusable component for displaying product recommendations
 * from the ML recommendation engine.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ChevronRight, Sparkles, TrendingUp, Users, Package } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationItem {
  product_id: string;
  score: number;
  source: string;
  explanation: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  discount?: number;
  images: string[];
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

interface ProductRecommendationsProps {
  /** Type of recommendations to display */
  type: "personalized" | "similar" | "also-bought" | "trending";
  /** User ID for personalized recommendations */
  userId?: string;
  /** Product ID for similar/also-bought recommendations */
  productId?: string;
  /** Region for trending recommendations */
  region?: string;
  /** Number of recommendations to show */
  limit?: number;
  /** Custom title for the section */
  title?: string;
  /** Whether to show as a carousel or grid */
  layout?: "carousel" | "grid";
  /** Custom CSS class */
  className?: string;
  /** Force real-time fetch (bypass cache) - use after user interactions */
  realtime?: boolean;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

const RecommendationSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 w-48 border rounded-xl shadow-sm p-3 bg-white"
      >
        <div className="bg-gray-200 h-40 w-full rounded-lg skeleton-shimmer"></div>
        <div className="mt-3 h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer"></div>
        <div className="mt-2 h-4 bg-gray-200 rounded w-1/2 skeleton-shimmer"></div>
        <div className="mt-3 flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-16 skeleton-shimmer"></div>
          <div className="h-8 bg-gray-200 rounded w-8 skeleton-shimmer"></div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductRecommendations({
  type,
  userId: propUserId,
  productId,
  region,
  limit = 6,
  title,
  layout = "carousel",
  className = "",
  realtime = false,
}: ProductRecommendationsProps) {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use prop userId or get from session
  const sessionUser = session?.user as { id?: string } | undefined;
  const userId = propUserId || sessionUser?.id;
  
  // For personalized recommendations, we need the user ID
  // Wait for session to load before fetching personalized recommendations
  const isSessionLoading = status === "loading";
  const canFetchPersonalized = type !== "personalized" || userId || status === "unauthenticated";

  // Get default title based on type
  const getDefaultTitle = () => {
    switch (type) {
      case "personalized":
        return "Recommended for You";
      case "similar":
        return "Similar Products";
      case "also-bought":
        return "Customers Also Bought";
      case "trending":
        return region ? `Trending in ${region}` : "Trending Now";
      default:
        return "Recommended Products";
    }
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case "personalized":
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case "similar":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "also-bought":
        return <Users className="w-5 h-5 text-green-500" />;
      case "trending":
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-gray-500" />;
    }
  };

  useEffect(() => {
    // Wait for session to load for personalized recommendations
    if (!canFetchPersonalized) {
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = new URLSearchParams({
          type,
          n: String(limit),
        });

        // Always append userId for personalized recommendations if available
        if (userId) {
          params.append("user_id", userId);
          console.log(`[Recommendations] Fetching ${type} for user: ${userId}`);
        } else {
          console.log(`[Recommendations] Fetching ${type} without user_id`);
        }
        
        if (productId) params.append("product_id", productId);
        if (region) params.append("region", region);
        
        // Real-time mode bypasses cache for fresh recommendations
        if (realtime) params.append("realtime", "true");

        // Fetch recommendations
        const recResponse = await fetch(`/api/recommendations?${params.toString()}`);
        
        if (!recResponse.ok) {
          // Fallback to regular products if recommendation server is unavailable
          const fallbackResponse = await fetch(`/api/products/public?limit=${limit}`);
          if (fallbackResponse.ok) {
            const fallbackProducts = await fallbackResponse.json();
            setProducts(Array.isArray(fallbackProducts) ? fallbackProducts.slice(0, limit) : []);
            setRecommendations([]);
          }
          return;
        }

        const recData = await recResponse.json();
        
        if (!recData.success || !recData.recommendations?.length) {
          // Fallback to regular products
          const fallbackResponse = await fetch(`/api/products/public?limit=${limit}`);
          if (fallbackResponse.ok) {
            const fallbackProducts = await fallbackResponse.json();
            setProducts(Array.isArray(fallbackProducts) ? fallbackProducts.slice(0, limit) : []);
          }
          return;
        }

        setRecommendations(recData.recommendations);

        // Fetch product details for recommendations
        const productIds = recData.recommendations.map((r: RecommendationItem) => r.product_id);
        const productsResponse = await fetch(`/api/products/public?ids=${productIds.join(",")}`);
        
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          // Sort products by recommendation order
          const productMap = new Map(
            (Array.isArray(productsData) ? productsData : []).map((p: Product) => [p._id, p])
          );
          const sortedProducts = productIds
            .map((id: string) => productMap.get(id))
            .filter(Boolean) as Product[];
          setProducts(sortedProducts);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Unable to load recommendations");
        
        // Try fallback
        try {
          const fallbackResponse = await fetch(`/api/products/public?limit=${limit}`);
          if (fallbackResponse.ok) {
            const fallbackProducts = await fallbackResponse.json();
            setProducts(Array.isArray(fallbackProducts) ? fallbackProducts.slice(0, limit) : []);
          }
        } catch {
          // Silent fail for fallback
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [type, userId, productId, region, limit, canFetchPersonalized]);

  // Add to cart handler
  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (response.ok) {
        toast.success("Added to cart!");
      } else {
        toast.error("Failed to add to cart");
      }
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  // Don't render if no products
  if (!loading && products.length === 0) {
    return null;
  }

  const displayTitle = title || getDefaultTitle();

  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              {displayTitle}
            </h2>
            {recommendations.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                AI Powered
              </span>
            )}
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-sm"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Loading State */}
        {loading && <RecommendationSkeleton count={limit} />}

        {/* Error State */}
        {error && !loading && products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>{error}</p>
          </div>
        )}

        {/* Products Display */}
        {!loading && products.length > 0 && (
          <div
            className={
              layout === "carousel"
                ? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            }
          >
            {products.map((product, index) => {
              const recommendation = recommendations[index];
              // Discount is in Rs, not percentage
              const discountedPrice = product.discount
                ? product.price - product.discount
                : product.price;

              return (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  className={`
                    ${layout === "carousel" ? "flex-shrink-0 w-48 snap-start" : ""}
                    group border rounded-xl shadow-sm p-3 bg-white hover:shadow-md transition-all duration-200
                  `}
                >
                  {/* Product Image */}
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={product.images?.[0] || "/placeholder-product.png"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, 192px"
                      loading="lazy"
                    />
                    {/* Discount Badge - Percentage */}
                    {product.discount && product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {Math.round((product.discount / product.price) * 100)}% OFF
                      </span>
                    )}
                    {/* Quick Add Button */}
                    <button
                      onClick={(e) => handleAddToCart(product._id, e)}
                      className="absolute bottom-2 right-2 bg-white/90 hover:bg-green-500 hover:text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Add to Cart"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  {product.averageRating && product.averageRating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-400">★</span>
                      <span className="text-xs text-gray-600">
                        {product.averageRating.toFixed(1)}
                        {product.reviewCount && ` (${product.reviewCount})`}
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">
                      ₹{discountedPrice.toFixed(0)}
                    </span>
                    {product.discount && product.discount > 0 && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹{product.price}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.stock <= 5 && product.stock > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      Only {product.stock} left!
                    </p>
                  )}
                  {product.stock === 0 && (
                    <p className="text-xs text-red-600 mt-1">Out of stock</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// SPECIALIZED EXPORTS
// ============================================================================

export function PersonalizedRecommendations({ 
  userId, 
  ...props 
}: Omit<ProductRecommendationsProps, "type"> & { userId: string }) {
  return <ProductRecommendations type="personalized" userId={userId} {...props} />;
}

export function SimilarProducts({ 
  productId, 
  ...props 
}: Omit<ProductRecommendationsProps, "type"> & { productId: string }) {
  return <ProductRecommendations type="similar" productId={productId} {...props} />;
}

export function CustomersAlsoBought({ 
  productId, 
  ...props 
}: Omit<ProductRecommendationsProps, "type"> & { productId: string }) {
  return <ProductRecommendations type="also-bought" productId={productId} {...props} />;
}

export function TrendingProducts({ 
  region, 
  ...props 
}: Omit<ProductRecommendationsProps, "type"> & { region?: string }) {
  return <ProductRecommendations type="trending" region={region} {...props} />;
}
