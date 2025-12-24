// src/components/Search.tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { Search, Grid, List, Filter as FilterIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import EmptyState from '@/components/ui/EmptyState';
import SearchFilters, { 
  MobileFilterDrawer, 
  SortDropdown, 
  FilterState, 
  defaultFilters,
  CategoryOption 
} from '@/components/ui/SearchFilters';

// ============ Types ============

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  image?: string;
  images?: string[];
  category?: string;
  categoryId?: string;
  categoryName?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  createdAt: string;
}

interface SearchResults {
  products: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  facets?: {
    name: string;
    display_name: string;
    values: { value: string; count: number }[];
  }[];
  source?: string;
}

// ============ URL Query Helpers ============

function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const categories = searchParams.get('categories');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minRating = searchParams.get('minRating');
  const inStock = searchParams.get('inStock');
  const hasDiscount = searchParams.get('hasDiscount');

  return {
    categories: categories ? categories.split(',').filter(Boolean) : [],
    minPrice: minPrice ? parseFloat(minPrice) : null,
    maxPrice: maxPrice ? parseFloat(maxPrice) : null,
    minRating: minRating ? parseFloat(minRating) : null,
    inStock: inStock === 'true',
    hasDiscount: hasDiscount === 'true',
  };
}

function buildQueryString(
  query: string,
  filters: FilterState,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  page: number
): string {
  const params = new URLSearchParams();
  
  if (query) params.set('query', query);
  if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
  if (filters.minPrice !== null) params.set('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== null) params.set('maxPrice', filters.maxPrice.toString());
  if (filters.minRating !== null) params.set('minRating', filters.minRating.toString());
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.hasDiscount) params.set('hasDiscount', 'true');
  if (sortBy !== 'relevance') params.set('sortBy', sortBy);
  if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
  if (page > 1) params.set('page', page.toString());

  return params.toString();
}

// ============ Search Content Component ============

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // URL state
  const query = searchParams.get('query') || '';
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSortBy = searchParams.get('sortBy') || 'relevance';
  const initialSortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  
  // Local state
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [filters, setFilters] = useState<FilterState>(() => parseFiltersFromURL(searchParams));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch categories for filter sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/category');
        if (res.ok) {
          const data = await res.json();
          if (data.categories) {
            setCategories(data.categories.map((cat: { _id: string; name: string; slug?: string }) => ({
              _id: cat._id,
              name: cat.name,
              slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
            })));
          }
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Update URL when filters change
  const updateURL = useCallback((
    newFilters: FilterState,
    newSortBy: string,
    newSortOrder: 'asc' | 'desc',
    newPage: number
  ) => {
    const queryString = buildQueryString(query, newFilters, newSortBy, newSortOrder, newPage);
    router.push(`${pathname}?${queryString}`, { scroll: false });
  }, [query, pathname, router]);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        query,
        page: currentPage.toString(),
        limit: '12',
        sortBy: sortBy === 'relevance' ? 'createdAt' : sortBy,
        sortOrder,
      });

      // Add filter params
      if (filters.categories.length > 0) {
        params.set('categoryId', filters.categories.join(','));
      }
      if (filters.minPrice !== null) {
        params.set('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== null) {
        params.set('maxPrice', filters.maxPrice.toString());
      }
      if (filters.minRating !== null) {
        params.set('minRating', filters.minRating.toString());
      }
      if (filters.inStock) {
        params.set('inStock', 'true');
      }
      if (filters.hasDiscount) {
        params.set('hasDiscount', 'true');
      }

      // Use advanced search endpoint
      const response = await fetch(`/api/search/advanced?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [query, currentPage, sortBy, sortOrder, filters]);

  // Fetch results when dependencies change
  useEffect(() => {
    if (query) {
      fetchResults();
    }
  }, [fetchResults, query]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, sortBy, sortOrder, 1);
  }, [sortBy, sortOrder, updateURL]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
    updateURL(filters, newSortBy, newSortOrder, 1);
  }, [filters, updateURL]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateURL(filters, sortBy, sortOrder, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, sortBy, sortOrder, updateURL]);

  // Handle filter reset
  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSortBy('relevance');
    setSortOrder('desc');
    setCurrentPage(1);
    updateURL(defaultFilters, 'relevance', 'desc', 1);
  }, [updateURL]);

  // Get product image
  const getProductImage = (product: Product) => {
    if (product.image) return product.image;
    if (product.images && product.images.length > 0) return product.images[0];
    return 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png';
  };

  // Calculate discounted price
  const getDiscountedPrice = (product: Product) => {
    if (!product.discount || product.discount === 0) return product.price;
    return product.price - (product.price * product.discount / 100);
  };

  // Empty query state
  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search size={64} className="mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Products</h1>
          <p className="text-gray-600">Enter a search term to find products</p>
        </div>
      </div>
    );
  }

  // Count active filters
  const activeFiltersCount = 
    filters.categories.length +
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          {results && !loading && (
            <p className="text-gray-600">
              {results.totalProducts.toLocaleString()} products found
              {results.source === 'meilisearch' && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Advanced Search
                </span>
              )}
            </p>
          )}
        </div>

        {/* Top Bar - Mobile Filter Button + Sort + View Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FilterIcon size={18} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <SortDropdown
              value={sortBy === 'price' ? `price-${sortOrder}` : sortBy}
              onChange={handleSortChange}
            />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 ml-auto lg:ml-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                loading={loading}
                resultCount={results?.totalProducts}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Loading State */}
            {loading && (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`bg-white rounded-lg shadow-sm p-4 ${
                      viewMode === 'list' ? 'flex gap-4' : ''
                    }`}
                  >
                    <div className={`${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square mb-4'} bg-gray-200 rounded-lg skeleton-shimmer`} />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded skeleton-shimmer" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
                      <div className="flex items-center justify-between">
                        <div className="h-5 bg-gray-200 rounded w-20 skeleton-shimmer" />
                        <div className="h-4 bg-gray-200 rounded w-16 skeleton-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">Error: {error}</p>
                <button 
                  onClick={fetchResults}
                  className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Results */}
            {results && !loading && (
              <>
                {results.products.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm">
                    <EmptyState 
                      variant="search"
                      title="No products found"
                      description={`We couldn't find any products matching "${query}"${activeFiltersCount > 0 ? ' with your current filters' : ''}. Try different keywords or adjust your filters.`}
                    >
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </EmptyState>
                  </div>
                ) : (
                  <>
                    {/* Products Grid/List */}
                    <div className={
                      viewMode === 'grid' 
                        ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8'
                        : 'space-y-4 mb-8'
                    }>
                      {results.products.map((product) => (
                        <Link
                          key={product._id}
                          href={`/products/${product._id}`}
                          className={`group bg-white rounded-lg shadow-sm hover:shadow-lg transition-all ${
                            viewMode === 'list' ? 'flex gap-4 p-4' : 'p-4'
                          }`}
                        >
                          {/* Product Image */}
                          <div className={`relative ${
                            viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square mb-4'
                          }`}>
                            <Image
                              src={getProductImage(product)}
                              alt={product.name}
                              fill
                              className="object-cover rounded-lg group-hover:scale-105 transition-transform"
                              loading="lazy"
                              sizes={viewMode === 'list' ? '128px' : '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'}
                            />
                            {/* Discount Badge */}
                            {product.discount && product.discount > 0 && (
                              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                                -{product.discount}%
                              </span>
                            )}
                            {/* Out of Stock Badge */}
                            {product.stock !== undefined && product.stock <= 0 && (
                              <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
                              {product.name}
                            </h3>
                            
                            {viewMode === 'list' && product.description && (
                              <p className="text-gray-500 text-sm mb-2 line-clamp-2">
                                {product.description}
                              </p>
                            )}

                            {/* Rating */}
                            {product.rating !== undefined && product.rating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <span className="flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                  ★ {product.rating.toFixed(1)}
                                </span>
                                {product.reviewCount !== undefined && product.reviewCount > 0 && (
                                  <span className="text-xs text-gray-500">
                                    ({product.reviewCount})
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Category */}
                            <span className="text-xs text-gray-500 capitalize mb-2">
                              {product.categoryName || product.category || 'Uncategorized'}
                            </span>

                            {/* Price */}
                            <div className="mt-auto">
                              {product.discount && product.discount > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-green-600">
                                    ₹{getDiscountedPrice(product).toLocaleString()}
                                  </span>
                                  <span className="text-sm text-gray-400 line-through">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-green-600">
                                  ₹{product.price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {results.totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!results.hasPrevPage}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        {(() => {
                          const pages = [];
                          const totalPages = results.totalPages;
                          const current = currentPage;
                          
                          // Always show first page
                          if (current > 3) {
                            pages.push(
                              <button
                                key={1}
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                1
                              </button>
                            );
                            if (current > 4) {
                              pages.push(<span key="dots1" className="px-2 text-gray-500">...</span>);
                            }
                          }
                          
                          // Show pages around current
                          for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`px-3 py-2 rounded-lg transition-colors ${
                                  current === i
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }
                          
                          // Always show last page
                          if (current < totalPages - 2) {
                            if (current < totalPages - 3) {
                              pages.push(<span key="dots2" className="px-2 text-gray-500">...</span>);
                            }
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                {totalPages}
                              </button>
                            );
                          }
                          
                          return pages;
                        })()}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!results.hasNextPage}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        loading={loading}
        resultCount={results?.totalProducts}
        onReset={handleResetFilters}
      />
    </div>
  );
}

// ============ Main Export ============

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}