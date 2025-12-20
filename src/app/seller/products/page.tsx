'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  discount: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  viewCount: number;
  orderCount: number;
  category?: { name: string };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/seller/products?${params}`);
      const result = await response.json();

      if (result.success) {
        // Handle nested data structure from API
        const data = result.data || {};
        setProducts(data.products || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/seller/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">Manage your product inventory</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/seller/products/bulk-upload"
                className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Link>
              <Link
                href="/seller/products/new"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (products || []).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm">
            <EmptyState 
              variant="products"
              title="No products found"
              description={searchTerm ? 'Try adjusting your search terms or filters' : 'Get started by adding your first product to start selling'}
              ctaText={searchTerm ? 'Clear Search' : 'Add Your First Product'}
              ctaHref={searchTerm ? undefined : '/seller/products/new'}
              onCtaClick={searchTerm ? () => setSearchTerm('') : undefined}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(products || []).map((product) => (
                <div key={product._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {product.status === 'active' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          Active
                        </span>
                      )}
                      {product.status === 'inactive' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                          Inactive
                        </span>
                      )}
                      {product.status === 'out_of_stock' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    {/* Low Stock Warning */}
                    {product.stock > 0 && product.stock <= product.lowStockThreshold && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-green-600">₹{product.price - product.discount}</span>
                        {product.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through ml-2">₹{product.price}</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {product.viewCount}
                      </span>
                      <span className="flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {product.orderCount} sold
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/seller/products/${product._id}`}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
