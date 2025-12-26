'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  isInLocalWishlist,
  addToLocalWishlist,
  removeFromLocalWishlist,
  addToWishlistAPI,
  removeFromWishlistAPI,
} from '@/lib/wishlist';

interface WishlistButtonProps {
  product: {
    _id: string;
    name: string;
    price: number;
    discount: number;
    images: string[];
    stock?: number;
  };
  /**
   * Button size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show text label
   * @default false
   */
  showLabel?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Variant style
   * @default 'icon'
   */
  variant?: 'icon' | 'button' | 'minimal';
  /**
   * Callback when wishlist state changes
   */
  onToggle?: (isInWishlist: boolean) => void;
}

export default function WishlistButton({
  product,
  size = 'md',
  showLabel = false,
  className = '',
  variant = 'icon',
  onToggle,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check initial state
  useEffect(() => {
    setMounted(true);
    setIsInWishlist(isInLocalWishlist(product._id));

    // Listen for wishlist updates
    const handleUpdate = () => {
      setIsInWishlist(isInLocalWishlist(product._id));
    };
    
    window.addEventListener('wishlistUpdated', handleUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleUpdate);
  }, [product._id]);

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;
    
    setIsLoading(true);
    const wasInWishlist = isInWishlist;

    try {
      if (wasInWishlist) {
        // Remove from wishlist
        removeFromLocalWishlist(product._id);
        setIsInWishlist(false);
        
        // Sync with server if logged in
        if (session?.user) {
          await removeFromWishlistAPI(product._id);
        }
        
        toast.success('Removed from wishlist');
      } else {
        // Add to wishlist
        const added = addToLocalWishlist(product);
        
        if (added) {
          setIsInWishlist(true);
          
          // Sync with server if logged in
          if (session?.user) {
            await addToWishlistAPI(product._id);
          }
          
          toast.success('Added to wishlist');
        } else {
          toast.error('Could not add to wishlist');
        }
      }
      
      onToggle?.(!wasInWishlist);
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      // Revert optimistic update on error
      setIsInWishlist(wasInWishlist);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [isInWishlist, isLoading, product, session, onToggle]);

  // Size classes
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm ${className}`}
        disabled
      >
        <Heart size={iconSizes[size]} className="text-gray-400" />
      </button>
    );
  }

  // Minimal variant (just the icon)
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`p-1 transition-all duration-200 ${className}`}
        title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          size={iconSizes[size]}
          className={`transition-all duration-200 ${
            isInWishlist
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-red-400'
          } ${isLoading ? 'animate-pulse' : ''}`}
        />
      </button>
    );
  }

  // Button variant (full button with optional label)
  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
          isInWishlist
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <Heart
          size={iconSizes[size]}
          className={`transition-all duration-200 ${
            isInWishlist ? 'fill-red-500 text-red-500' : ''
          } ${isLoading ? 'animate-pulse' : ''}`}
        />
        {showLabel && (
          <span className="text-sm font-medium">
            {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
          </span>
        )}
      </button>
    );
  }

  // Icon variant (default - floating icon button)
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 ${
        isInWishlist ? 'bg-red-50' : 'hover:bg-red-50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={iconSizes[size]}
        className={`transition-all duration-200 ${
          isInWishlist
            ? 'fill-red-500 text-red-500 scale-110'
            : 'text-gray-400 hover:text-red-400'
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
    </button>
  );
}

// Hook for easy wishlist state management
export function useWishlist(productId: string) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsInWishlist(isInLocalWishlist(productId));

    const handleUpdate = () => {
      setIsInWishlist(isInLocalWishlist(productId));
    };
    
    window.addEventListener('wishlistUpdated', handleUpdate);
    return () => window.removeEventListener('wishlistUpdated', handleUpdate);
  }, [productId]);

  return { isInWishlist, mounted };
}
