/**
 * Wishlist Utility
 * Manages wishlist functionality with localStorage for guests and API sync for logged-in users
 * 
 * @module wishlist
 */

const STORAGE_KEY = 'deligo_wishlist';
const MAX_ITEMS = 50;

export interface WishlistProduct {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  stock?: number;
  addedAt: string;
  priceAtAdd: number; // Track price when added for price drop alerts
}

export interface WishlistState {
  products: WishlistProduct[];
  lastSynced?: string;
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
 * Get all wishlist products from localStorage
 * @returns Array of wishlist products
 */
export const getLocalWishlist = (): WishlistProduct[] => {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const state: WishlistState = JSON.parse(stored);
    return state.products || [];
  } catch (error) {
    console.error('Error reading wishlist:', error);
    return [];
  }
};

/**
 * Save wishlist to localStorage
 */
const saveLocalWishlist = (products: WishlistProduct[]): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const state: WishlistState = {
      products,
      lastSynced: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Dispatch event for components to react
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
      detail: { products, count: products.length } 
    }));
  } catch (error) {
    console.error('Error saving wishlist:', error);
  }
};

/**
 * Add a product to wishlist (localStorage)
 * @param product - Product to add
 * @returns true if added, false if already exists or error
 */
export const addToLocalWishlist = (product: {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  stock?: number;
}): boolean => {
  if (!isLocalStorageAvailable()) return false;
  if (!product._id) return false;
  
  try {
    const products = getLocalWishlist();
    
    // Check if already in wishlist
    if (products.some(p => p._id === product._id)) {
      return false;
    }
    
    // Check max items limit
    if (products.length >= MAX_ITEMS) {
      console.warn(`Wishlist full (max ${MAX_ITEMS} items)`);
      return false;
    }
    
    const newProduct: WishlistProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      discount: product.discount,
      images: product.images || [],
      stock: product.stock,
      addedAt: new Date().toISOString(),
      priceAtAdd: product.price - product.discount,
    };
    
    const updated = [newProduct, ...products];
    saveLocalWishlist(updated);
    return true;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return false;
  }
};

/**
 * Remove a product from wishlist (localStorage)
 * @param productId - ID of product to remove
 * @returns true if removed, false if not found or error
 */
export const removeFromLocalWishlist = (productId: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const products = getLocalWishlist();
    const filtered = products.filter(p => p._id !== productId);
    
    if (filtered.length === products.length) {
      return false; // Product not found
    }
    
    saveLocalWishlist(filtered);
    return true;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return false;
  }
};

/**
 * Toggle a product in wishlist
 * @param product - Product to toggle
 * @returns true if now in wishlist, false if removed
 */
export const toggleLocalWishlist = (product: {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  stock?: number;
}): boolean => {
  if (isInLocalWishlist(product._id)) {
    removeFromLocalWishlist(product._id);
    return false;
  } else {
    addToLocalWishlist(product);
    return true;
  }
};

/**
 * Check if a product is in wishlist (localStorage)
 * @param productId - ID of product to check
 * @returns true if in wishlist
 */
export const isInLocalWishlist = (productId: string): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const products = getLocalWishlist();
    return products.some(p => p._id === productId);
  } catch {
    return false;
  }
};

/**
 * Clear all items from local wishlist
 */
export const clearLocalWishlist = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { 
      detail: { products: [], count: 0 } 
    }));
  } catch (error) {
    console.error('Error clearing wishlist:', error);
  }
};

/**
 * Get wishlist count
 * @returns Number of items in wishlist
 */
export const getLocalWishlistCount = (): number => {
  return getLocalWishlist().length;
};

/**
 * Get wishlist product IDs only
 * @returns Array of product IDs
 */
export const getLocalWishlistIds = (): string[] => {
  return getLocalWishlist().map(p => p._id);
};

/**
 * Get products with price drops
 * @returns Products where current price is less than price when added
 */
export const getProductsWithPriceDrops = (): WishlistProduct[] => {
  return getLocalWishlist().filter(p => {
    const currentPrice = p.price - p.discount;
    return currentPrice < p.priceAtAdd;
  });
};

/**
 * Update product prices in local wishlist (to detect price drops)
 * Call this when fetching fresh product data
 */
export const updateLocalWishlistPrices = (
  products: Array<{ _id: string; price: number; discount: number; stock?: number }>
): void => {
  if (!isLocalStorageAvailable()) return;
  
  const wishlist = getLocalWishlist();
  const productMap = new Map(products.map(p => [p._id, p]));
  
  const updated = wishlist.map(item => {
    const fresh = productMap.get(item._id);
    if (fresh) {
      return {
        ...item,
        price: fresh.price,
        discount: fresh.discount,
        stock: fresh.stock,
        // Keep priceAtAdd unchanged for price drop comparison
      };
    }
    return item;
  });
  
  saveLocalWishlist(updated);
};

// ============================================
// API Sync Functions (for logged-in users)
// ============================================

/**
 * Sync local wishlist to server (merge local with server)
 * Call this when user logs in
 */
export const syncWishlistToServer = async (): Promise<boolean> => {
  try {
    const localProducts = getLocalWishlist();
    const localIds = localProducts.map(p => p._id);
    
    if (localIds.length === 0) return true;
    
    const response = await fetch('/api/wishlist/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: localIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync wishlist');
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing wishlist to server:', error);
    return false;
  }
};

/**
 * Fetch wishlist from server and merge with local
 * Call this when user logs in
 */
export const fetchServerWishlist = async (): Promise<WishlistProduct[]> => {
  try {
    const response = await fetch('/api/wishlist');
    
    if (!response.ok) {
      if (response.status === 401) {
        // Not logged in, return local wishlist
        return getLocalWishlist();
      }
      throw new Error('Failed to fetch wishlist');
    }
    
    const data = await response.json();
    const serverProducts: WishlistProduct[] = data.products || [];
    
    // Merge with local (server takes precedence, but keep local-only items)
    const localProducts = getLocalWishlist();
    const serverIds = new Set(serverProducts.map(p => p._id));
    
    // Add local items not in server
    const localOnly = localProducts.filter(p => !serverIds.has(p._id));
    const merged = [...serverProducts, ...localOnly];
    
    // Save merged back to localStorage
    saveLocalWishlist(merged);
    
    return merged;
  } catch (error) {
    console.error('Error fetching server wishlist:', error);
    return getLocalWishlist();
  }
};

/**
 * Add to wishlist via API (for logged-in users)
 */
export const addToWishlistAPI = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error adding to wishlist API:', error);
    return false;
  }
};

/**
 * Remove from wishlist via API (for logged-in users)
 */
export const removeFromWishlistAPI = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error removing from wishlist API:', error);
    return false;
  }
};

/**
 * Move item from wishlist to cart
 */
export const moveToCart = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist/move-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    
    if (response.ok) {
      // Remove from local wishlist
      removeFromLocalWishlist(productId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error moving to cart:', error);
    return false;
  }
};

/**
 * Move all wishlist items to cart
 */
export const moveAllToCart = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist/move-all-to-cart', {
      method: 'POST',
    });
    
    if (response.ok) {
      clearLocalWishlist();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error moving all to cart:', error);
    return false;
  }
};
