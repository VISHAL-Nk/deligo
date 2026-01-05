/**
 * User-specific Recently Viewed Products Utility
 * Tracks recently viewed products using user accounts instead of localStorage
 * 
 * @module user-recently-viewed
 */

export interface RecentlyViewedProduct {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  viewedAt: string;
  category?: string;
  seller?: string;
}

/**
 * Get all recently viewed products for the current user
 * @returns Array of recently viewed products sorted by most recent first
 */
export const getUserRecentlyViewed = async (): Promise<RecentlyViewedProduct[]> => {
  try {
    const response = await fetch('/api/user/recently-viewed', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      // If user is not logged in or API fails, return empty array
      return [];
    }

    const data = await response.json();
    return data.recentlyViewed || [];
  } catch (error) {
    console.error('Error fetching recently viewed products:', error);
    return [];
  }
};

/**
 * Add a product to recently viewed for the current user
 * If product already exists, updates its viewedAt timestamp
 * 
 * @param product - Product to add to recently viewed
 */
export const addToUserRecentlyViewed = async (product: {
  _id: string;
  name?: string;
  price?: number;
  discount?: number;
  images?: string[];
}): Promise<void> => {
  if (!product._id) return;
  
  try {
    const response = await fetch('/api/user/recently-viewed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        productId: product._id,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to add product to recently viewed (user may not be logged in)');
      return;
    }

    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('userRecentlyViewedUpdated', { 
      detail: { productId: product._id } 
    }));
  } catch (error) {
    console.error('Error saving recently viewed product:', error);
  }
};

/**
 * Clear all recently viewed products for the current user
 */
export const clearUserRecentlyViewed = async (): Promise<void> => {
  try {
    const response = await fetch('/api/user/recently-viewed', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Failed to clear recently viewed (user may not be logged in)');
      return;
    }

    window.dispatchEvent(new CustomEvent('userRecentlyViewedUpdated', { 
      detail: { cleared: true } 
    }));
  } catch (error) {
    console.error('Error clearing recently viewed products:', error);
  }
};

/**
 * Check if a product is in recently viewed for the current user
 * @param productId - ID of product to check
 * @returns Boolean indicating if product is in recently viewed
 */
export const isUserRecentlyViewed = async (productId: string): Promise<boolean> => {
  try {
    const products = await getUserRecentlyViewed();
    return products.some(p => p._id === productId);
  } catch {
    return false;
  }
};

/**
 * Get recently viewed product IDs only (useful for API calls)
 * @returns Array of product IDs
 */
export const getUserRecentlyViewedIds = async (): Promise<string[]> => {
  const products = await getUserRecentlyViewed();
  return products.map(p => p._id);
};

/**
 * Get count of recently viewed products for current user
 * @returns Number of products in recently viewed
 */
export const getUserRecentlyViewedCount = async (): Promise<number> => {
  const products = await getUserRecentlyViewed();
  return products.length;
};