/**
 * Recently Viewed Products Utility
 * Tracks the last 10 products viewed by the user using localStorage
 * 
 * @module recently-viewed
 */

const STORAGE_KEY = 'deligo_recently_viewed';
const MAX_ITEMS = 10;

export interface RecentlyViewedProduct {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  viewedAt: string;
}

/**
 * Check if localStorage is available (client-side only)
 */
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get all recently viewed products
 * @returns Array of recently viewed products sorted by most recent first
 */
export const getRecentlyViewed = (): RecentlyViewedProduct[] => {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const products: RecentlyViewedProduct[] = JSON.parse(stored);
    // Sort by viewedAt descending (most recent first)
    return products.sort((a, b) => 
      new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );
  } catch (error) {
    console.error('Error reading recently viewed products:', error);
    return [];
  }
};

/**
 * Add a product to recently viewed
 * If product already exists, updates its viewedAt timestamp
 * Maintains maximum of MAX_ITEMS products
 * 
 * @param product - Product to add to recently viewed
 */
export const addToRecentlyViewed = (product: {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
}): void => {
  if (!isLocalStorageAvailable()) return;
  if (!product._id) return;
  
  try {
    const products = getRecentlyViewed();
    
    // Remove existing entry if present (we'll add it fresh)
    const filtered = products.filter(p => p._id !== product._id);
    
    // Create new entry with timestamp
    const newEntry: RecentlyViewedProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      discount: product.discount,
      images: product.images || [],
      viewedAt: new Date().toISOString(),
    };
    
    // Add to beginning (most recent first)
    const updated = [newEntry, ...filtered].slice(0, MAX_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated', { 
      detail: { products: updated } 
    }));
  } catch (error) {
    console.error('Error saving recently viewed product:', error);
  }
};

/**
 * Remove a product from recently viewed
 * @param productId - ID of product to remove
 */
export const removeFromRecentlyViewed = (productId: string): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const products = getRecentlyViewed();
    const filtered = products.filter(p => p._id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated', { 
      detail: { products: filtered } 
    }));
  } catch (error) {
    console.error('Error removing recently viewed product:', error);
  }
};

/**
 * Clear all recently viewed products
 */
export const clearRecentlyViewed = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated', { 
      detail: { products: [] } 
    }));
  } catch (error) {
    console.error('Error clearing recently viewed products:', error);
  }
};

/**
 * Check if a product is in recently viewed
 * @param productId - ID of product to check
 * @returns Boolean indicating if product is in recently viewed
 */
export const isRecentlyViewed = (productId: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const products = getRecentlyViewed();
    return products.some(p => p._id === productId);
  } catch {
    return false;
  }
};

/**
 * Get recently viewed product IDs only (useful for API calls)
 * @returns Array of product IDs
 */
export const getRecentlyViewedIds = (): string[] => {
  return getRecentlyViewed().map(p => p._id);
};

/**
 * Get count of recently viewed products
 * @returns Number of products in recently viewed
 */
export const getRecentlyViewedCount = (): number => {
  return getRecentlyViewed().length;
};
