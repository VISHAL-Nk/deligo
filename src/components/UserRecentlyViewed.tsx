'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ChevronRight, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  getUserRecentlyViewed, 
  clearUserRecentlyViewed,
  RecentlyViewedProduct 
} from '@/lib/user-recently-viewed';

interface UserRecentlyViewedProps {
  /**
   * Maximum number of products to display
   * @default 6
   */
  maxDisplay?: number;
  /**
   * Display mode: 'carousel' for horizontal scroll, 'grid' for static grid
   * @default 'carousel'
   */
  displayMode?: 'carousel' | 'grid';
  /**
   * Title for the section
   * @default 'Recently Viewed'
   */
  title?: string;
  /**
   * Product ID to exclude from display (useful on product detail page)
   */
  excludeProductId?: string;
  /**
   * Show clear all button
   * @default true
   */
  showClearAll?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

const RecentlyViewedSkeleton = ({ count = 4 }: { count?: number }) => (
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

export default function UserRecentlyViewed({
  maxDisplay = 6,
  displayMode = 'carousel',
  title = 'Recently Viewed',
  excludeProductId,
  showClearAll = true,
  className = '',
}: UserRecentlyViewedProps) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load products from user account
  useEffect(() => {
    if (session?.user) {
      loadProducts();
    } else {
      setLoading(false);
      setProducts([]);
    }

    // Listen for updates
    const handleUpdate = () => {
      if (session?.user) {
        loadProducts();
      }
    };
    window.addEventListener('userRecentlyViewedUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('userRecentlyViewedUpdated', handleUpdate);
    };
  }, [excludeProductId, session?.user]);

  const loadProducts = async () => {
    if (!session?.user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let items = await getUserRecentlyViewed();
      
      // Exclude current product if specified
      if (excludeProductId) {
        items = items.filter(p => p._id !== excludeProductId);
      }
      
      setProducts(items.slice(0, maxDisplay));
    } catch (err) {
      console.error('Error loading recently viewed:', err);
      setError('Failed to load recently viewed items');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearUserRecentlyViewed();
      setProducts([]);
      toast.success('Recently viewed cleared!');
    } catch (err) {
      toast.error('Failed to clear recently viewed');
    }
  };

  const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Don't render if user is not logged in
  if (!session?.user) {
    return null;
  }

  // Don't render if no products and not loading
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              {title}
            </h2>
            {products.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {products.length} item{products.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showClearAll && products.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all recently viewed"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && <RecentlyViewedSkeleton count={maxDisplay} />}

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
              displayMode === "carousel"
                ? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            }
          >
            {products.map((product) => {
              // Calculate discounted price
              const discountedPrice = product.discount && product.discount > 0
                ? product.price * (1 - product.discount / 100)
                : product.price;

              return (
                <Link
                  key={product._id}
                  href={`/products/${product._id}`}
                  className={`
                    ${displayMode === "carousel" ? "flex-shrink-0 w-48 snap-start" : ""}
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
                    {/* Discount Badge */}
                    {product.discount && product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.discount}% OFF
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
                    {/* Recently Viewed Badge */}
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {formatTimeAgo(product.viewedAt)}
                    </span>
                  </div>

                  {/* Product Info */}
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">
                      ₹{Math.round(discountedPrice)}
                    </span>
                    {product.discount && product.discount > 0 && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹{product.price}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}