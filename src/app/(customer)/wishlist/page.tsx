'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Bell, 
  BellOff,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Share2,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import { 
  getLocalWishlist, 
  removeFromLocalWishlist, 
  clearLocalWishlist,
  syncWishlistToServer,
  WishlistProduct,
} from '@/lib/wishlist';

interface WishlistItem extends WishlistProduct {
  hasPriceDrop?: boolean;
  currentPrice?: number;
  priceDifference?: number;
  priceAlertEnabled?: boolean;
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [movingToCart, setMovingToCart] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [wishlistName, setWishlistName] = useState('My Wishlist');

  // Fetch wishlist (from server if logged in, else localStorage)
  const fetchWishlist = useCallback(async () => {
    try {
      if (session?.user) {
        // Fetch from server
        const response = await fetch('/api/wishlist');
        if (response.ok) {
          const data = await response.json();
          setItems(data.products.map((item: { 
            productId: { 
              _id: string; 
              name: string; 
              price: number; 
              discount: number; 
              images: string[]; 
              stock: number 
            }; 
            addedAt: string; 
            priceAtAdd: number;
            hasPriceDrop: boolean;
            currentPrice: number;
            priceDifference: number;
            priceAlertEnabled: boolean;
          }) => ({
            _id: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            discount: item.productId.discount,
            images: item.productId.images,
            stock: item.productId.stock,
            addedAt: item.addedAt,
            priceAtAdd: item.priceAtAdd,
            hasPriceDrop: item.hasPriceDrop,
            currentPrice: item.currentPrice,
            priceDifference: item.priceDifference,
            priceAlertEnabled: item.priceAlertEnabled,
          })));
        } else {
          // Fallback to local
          setItems(getLocalWishlist());
        }

        // Fetch wishlist name from profile
        try {
          const profileResponse = await fetch('/api/user/profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setWishlistName(profileData.profile?.preferences?.wishlistName || 'My Wishlist');
          }
        } catch (error) {
          console.error('Error fetching wishlist name:', error);
        }
      } else {
        // Use localStorage
        setItems(getLocalWishlist());
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setItems(getLocalWishlist());
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status !== 'loading') {
      fetchWishlist();
    }
  }, [mounted, status, fetchWishlist]);

  // Listen for wishlist updates
  useEffect(() => {
    const handleUpdate = () => fetchWishlist();
    window.addEventListener('wishlistUpdated', handleUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleUpdate);
  }, [fetchWishlist]);

  // Sync local wishlist to server when user logs in
  useEffect(() => {
    if (session?.user && mounted) {
      const syncLocal = async () => {
        const localItems = getLocalWishlist();
        if (localItems.length > 0) {
          setSyncLoading(true);
          await syncWishlistToServer();
          await fetchWishlist();
          setSyncLoading(false);
        }
      };
      syncLocal();
    }
  }, [session, mounted, fetchWishlist]);

  const handleRemove = async (productId: string) => {
    try {
      removeFromLocalWishlist(productId);
      
      if (session?.user) {
        await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
      }
      
      setItems(prev => prev.filter(item => item._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) return;
    
    try {
      clearLocalWishlist();
      
      if (session?.user) {
        // Clear server wishlist
        for (const item of items) {
          await fetch('/api/wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item._id }),
          });
        }
      }
      
      setItems([]);
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  const handleMoveToCart = async (productId: string) => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/wishlist');
      return;
    }

    setMovingToCart(prev => new Set(prev).add(productId));
    
    try {
      const response = await fetch('/api/wishlist/move-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      
      if (response.ok) {
        removeFromLocalWishlist(productId);
        setItems(prev => prev.filter(item => item._id !== productId));
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Moved to cart');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to move to cart');
      }
    } catch (error) {
      console.error('Error moving to cart:', error);
      toast.error('Failed to move to cart');
    } finally {
      setMovingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleMoveAllToCart = async () => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/wishlist');
      return;
    }

    try {
      const response = await fetch('/api/wishlist/move-all-to-cart', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        clearLocalWishlist();
        setItems([]);
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success(`${data.added} items moved to cart`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to move items');
      }
    } catch (error) {
      console.error('Error moving all to cart:', error);
      toast.error('Failed to move items');
    }
  };

  const handleTogglePriceAlert = async (productId: string, currentState: boolean) => {
    if (!session?.user) {
      toast.error('Please sign in to enable price alerts');
      return;
    }

    try {
      const response = await fetch('/api/wishlist/price-alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, enabled: !currentState }),
      });
      
      if (response.ok) {
        setItems(prev => prev.map(item => 
          item._id === productId 
            ? { ...item, priceAlertEnabled: !currentState }
            : item
        ));
        toast.success(!currentState ? 'Price alert enabled' : 'Price alert disabled');
      }
    } catch (error) {
      console.error('Error toggling price alert:', error);
      toast.error('Failed to update price alert');
    }
  };

  const handleShare = async (item: WishlistItem) => {
    const url = `${window.location.origin}/products/${item._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: `Check out ${item.name} on Deligo!`,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading skeleton
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8 skeleton-shimmer" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-200 skeleton-shimmer" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 skeleton-shimmer" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4 skeleton-shimmer" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <EmptyState
            variant="wishlist"
            title="Your wishlist is empty"
            description="Start adding products you love to your wishlist"
            ctaText="Browse Products"
            ctaHref="/products"
          />
        </div>
      </div>
    );
  }

  const priceDropItems = items.filter(item => item.hasPriceDrop);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                {wishlistName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'item' : 'items'}
                {syncLoading && (
                  <span className="ml-2 inline-flex items-center gap-1 text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 border border-gray-200 rounded-lg hover:border-red-200 transition-colors"
            >
              Clear All
            </button>
            {session?.user && (
              <button
                onClick={handleMoveAllToCart}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Move All to Cart
              </button>
            )}
          </div>
        </div>

        {/* Price Drop Alert */}
        {priceDropItems.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <TrendingDown className="w-5 h-5" />
              Price Drops! ({priceDropItems.length} {priceDropItems.length === 1 ? 'item' : 'items'})
            </div>
            <p className="text-sm text-green-600">
              Some items in your wishlist have dropped in price. Grab them before prices go up!
            </p>
          </div>
        )}

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const finalPrice = item.price - item.discount;
            const discountPercentage = item.discount > 0 
              ? Math.round((item.discount / item.price) * 100) 
              : 0;
            const isOutOfStock = (item.stock ?? 0) <= 0;

            return (
              <div
                key={item._id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                  item.hasPriceDrop ? 'ring-2 ring-green-400' : ''
                }`}
              >
                {/* Image */}
                <Link href={`/products/${item._id}`} className="block relative">
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={item.images[0] || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png'}
                      alt={item.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      loading="lazy"
                    />
                    
                    {/* Badges */}
                    {discountPercentage > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {discountPercentage}% OFF
                      </div>
                    )}
                    
                    {item.hasPriceDrop && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Price Drop
                      </div>
                    )}
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/products/${item._id}`}>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 hover:text-green-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-bold text-green-600">
                      {formatPrice(finalPrice)}
                    </span>
                    {item.discount > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>

                  {/* Price drop info */}
                  {item.hasPriceDrop && item.priceDifference && (
                    <p className="text-xs text-green-600 mb-2">
                      Save {formatPrice(item.priceDifference)} from when you added it!
                    </p>
                  )}
                  
                  {/* Added date */}
                  <p className="text-xs text-gray-400 mb-3">
                    Added {formatDate(item.addedAt)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMoveToCart(item._id)}
                      disabled={isOutOfStock || movingToCart.has(item._id)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {movingToCart.has(item._id) ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Secondary actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    {session?.user && (
                      <button
                        onClick={() => handleTogglePriceAlert(item._id, !!item.priceAlertEnabled)}
                        className={`flex items-center gap-1 text-xs ${
                          item.priceAlertEnabled
                            ? 'text-blue-600 hover:text-blue-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={item.priceAlertEnabled ? 'Disable price alert' : 'Enable price alert'}
                      >
                        {item.priceAlertEnabled ? (
                          <>
                            <Bell className="w-4 h-4 fill-current" />
                            <span className="hidden sm:inline">Alert On</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Price Alert</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShare(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/products/${item._id}`}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                        title="View product"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleRemove(item._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sign in prompt for guests */}
        {!session?.user && items.length > 0 && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <p className="text-blue-800 mb-2">
              Sign in to sync your wishlist across devices and enable price alerts!
            </p>
            <Link
              href="/auth/signin?callbackUrl=/wishlist"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
