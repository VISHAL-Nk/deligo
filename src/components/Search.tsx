// src/components/Search.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Search, Filter, SortAsc, SortDesc, Grid, List } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import EmptyState from '@/components/ui/EmptyState';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  createdAt: string;
}

interface SearchResults {
  products: Product[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchResults = async (searchQuery: string, page = 1) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        ...(selectedCategory && { category: selectedCategory })
      });

      const response = await fetch(`/api/search?${params}`);
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
  };

  useEffect(() => {
    if (query) {
      fetchResults(query, currentPage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentPage, sortBy, sortOrder, selectedCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          {results && (
            <p className="text-gray-600">
              {results.totalProducts} products found
            </p>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="home">Home & Garden</option>
                  <option value="books">Books</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <button
                  onClick={() => handleSortChange('name')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    sortBy === 'name' 
                      ? 'bg-green-100 text-green-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Name
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                  )}
                </button>
                <button
                  onClick={() => handleSortChange('price')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    sortBy === 'price' 
                      ? 'bg-green-100 text-green-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Price
                  {sortBy === 'price' && (
                    sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                  )}
                </button>
                <button
                  onClick={() => handleSortChange('createdAt')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    sortBy === 'createdAt' 
                      ? 'bg-green-100 text-green-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Date
                  {sortBy === 'createdAt' && (
                    sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                  )}
                </button>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-green-100 text-green-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Searching products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {results.products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm">
                <EmptyState 
                  variant="search"
                  description={`We couldn't find any products matching "${query}". Try different keywords or browse all products.`}
                />
              </div>
            ) : (
              <>
                {/* Products Grid/List */}
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8'
                    : 'space-y-4 mb-8'
                }>
                  {results.products.map((product) => (
                    <div
                      key={product._id}
                      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                        viewMode === 'list' ? 'flex gap-4 p-4' : 'p-4'
                      }`}
                    >
                      <div className={`relative ${
                        viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square mb-4'
                      }`}>
                        <Image
                          src={product.image || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png'}
                          alt={product.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes={viewMode === 'list' ? '96px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            ${product.price}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {product.category}
                          </span>
                        </div>
                        <Link
                          href={`/products/${product._id}`}
                          className="mt-3 block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {results.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!results.hasPrevPage}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: results.totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === i + 1
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!results.hasNextPage}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}