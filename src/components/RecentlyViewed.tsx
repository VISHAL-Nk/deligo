'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { 
  getRecentlyViewed, 
  removeFromRecentlyViewed, 
  clearRecentlyViewed,
  RecentlyViewedProduct 
} from '@/lib/recently-viewed';

interface RecentlyViewedProps {
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

export default function RecentlyViewed({
  maxDisplay = 6,
  displayMode = 'carousel',
  title = 'Recently Viewed',
  excludeProductId,
  showClearAll = true,
  className = '',
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Load products from localStorage
  useEffect(() => {
    setMounted(true);
    loadProducts();

    // Listen for updates
    const handleUpdate = () => loadProducts();
    window.addEventListener('recentlyViewedUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('recentlyViewedUpdated', handleUpdate);
    };
  }, [excludeProductId]);

  const loadProducts = () => {
    let items = getRecentlyViewed();
    
    // Exclude current product if specified
    if (excludeProductId) {
      items = items.filter(p => p._id !== excludeProductId);
    }
    
    setProducts(items.slice(0, maxDisplay));
  };

  const handleRemove = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromRecentlyViewed(productId);
  };

  const handleClearAll = () => {
    clearRecentlyViewed();
    setProducts([]);
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('recently-viewed-container');
    if (!container) return;

    const scrollAmount = 240; // Card width + gap
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;
    
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Don't render on server or if no products
  if (!mounted || products.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <span className="text-sm text-gray-500">({products.length})</span>
          </div>
          
          <div className="flex items-center gap-2">
            {showClearAll && products.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            
            {displayMode === 'carousel' && products.length > 4 && (
              <div className="flex gap-1">
                <button
                  onClick={() => scroll('left')}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={scrollPosition === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        {displayMode === 'carousel' ? (
          <div
            id="recently-viewed-container"
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                formatPrice={formatPrice}
                formatRelativeTime={formatRelativeTime}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                formatPrice={formatPrice}
                formatRelativeTime={formatRelativeTime}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Individual Product Card Component
interface ProductCardProps {
  product: RecentlyViewedProduct;
  formatPrice: (price: number) => string;
  formatRelativeTime: (dateStr: string) => string;
  onRemove: (productId: string, e: React.MouseEvent) => void;
}

function ProductCard({ product, formatPrice, formatRelativeTime, onRemove }: ProductCardProps) {
  const finalPrice = product.price - product.discount;
  const discountPercentage = product.discount > 0 
    ? Math.round((product.discount / product.price) * 100) 
    : 0;

  return (
    <Link
      href={`/products/${product._id}`}
      className="group relative flex-shrink-0 w-[180px] bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Remove Button */}
      <button
        onClick={(e) => onRemove(product._id, e)}
        className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
        title="Remove from recently viewed"
      >
        <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
      </button>

      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          {discountPercentage}% OFF
        </div>
      )}

      {/* Image */}
      <div className="relative h-32 w-full overflow-hidden bg-gray-50">
        <Image
          src={product.images[0] || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png'}
          alt={product.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300"
          sizes="180px"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-bold text-green-600">
            {formatPrice(finalPrice)}
          </span>
          {product.discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Viewed time */}
        <p className="text-[10px] text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(product.viewedAt)}
        </p>
      </div>
    </Link>
  );
}

// Skeleton loader for RecentlyViewed
export function RecentlyViewedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 bg-gray-200 rounded skeleton-shimmer" />
          <div className="h-6 w-40 bg-gray-200 rounded skeleton-shimmer" />
        </div>
        
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[180px] bg-white border rounded-xl overflow-hidden"
            >
              <div className="h-32 bg-gray-200 skeleton-shimmer" />
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded mb-2 skeleton-shimmer" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2 skeleton-shimmer" />
                <div className="h-3 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
