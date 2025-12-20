'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Category {
  _id: string;
  name: string;
  parentCategoryId?: {
    _id: string;
    name: string;
  } | null;
  filters: string[];
  createdAt: string;
  updatedAt?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parentCategoryId: '',
    filters: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seeding, setSeeding] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors

      const response = await fetch(`/api/admin/categories`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Handle different error types
        if (response.status === 401) {
          setError('Please login to access this page');
          setCategories([]);
          return;
        }
        
        if (response.status === 403) {
          setError('You do not have permission to view categories. Admin access required.');
          setCategories([]);
          return;
        }
        
        // 404 is ok for empty database
        if (response.status === 404) {
          setCategories([]);
          return;
        }
        
        // 500 Internal Server Error - likely database issue
        if (response.status === 500) {
          console.error('Server error:', errorData);
          setError('Server error. Please check the database connection and try again.');
          setCategories([]);
          return;
        }
        
        // For other errors, show the message but don't throw
        console.error(`HTTP ${response.status}:`, errorData);
        setError(errorData.error || `Failed to load categories (${response.status})`);
        setCategories([]);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setCategories(result.data?.categories || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories';
      setError(errorMessage);
      setCategories([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : '/api/admin/categories';

      const method = editingCategory ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          parentCategoryId: formData.parentCategoryId || null,
          filters: formData.filters
            ? formData.filters.split(',').map((f) => f.trim())
            : [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save category');
      }

      setSuccess(
        editingCategory
          ? 'Category updated successfully'
          : 'Category created successfully'
      );
      setShowModal(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        parentCategoryId: '',
        filters: '',
      });
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentCategoryId: category.parentCategoryId?._id || '',
      filters: category.filters.join(', '),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  const handleSeedCategories = async () => {
    if (!confirm('This will add default categories to your database. Continue?')) return;

    try {
      setSeeding(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/admin/categories/seed', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to seed categories');
      }

      setSuccess(`Successfully created ${result.data.count} default categories`);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed categories');
    } finally {
      setSeeding(false);
    }
  };

  const filteredCategories = (categories || []).filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
              <p className="text-gray-600 mt-1">Manage product categories</p>
            </div>
            <div className="flex gap-3">
              {categories.length === 0 && !loading && !error && !searchTerm && (
                <button
                  onClick={handleSeedCategories}
                  disabled={seeding}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add 10 pre-configured default categories"
                >
                  {seeding ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      Add Default Categories
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({
                    name: '',
                    parentCategoryId: '',
                    filters: '',
                  });
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm">
            <EmptyState 
              variant="categories"
              title="No categories found"
              description={searchTerm 
                ? 'Try adjusting your search terms' 
                : categories.length === 0 
                  ? 'Get started by adding default categories or creating your own' 
                  : 'No categories match the current filter'}
            >
              {!searchTerm && categories.length === 0 && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleSeedCategories}
                    disabled={seeding}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {seeding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Tag className="w-5 h-5 mr-2" />
                        Add 10 Default Categories
                      </>
                    )}
                  </button>
                  <span className="text-gray-500 self-center">or</span>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Custom Category
                  </button>
                </div>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </EmptyState>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Parent</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Filters</th>
                    <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {category.parentCategoryId && (
                            <FolderTree className="w-4 h-4 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{category.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {category.parentCategoryId ? (
                          <span className="text-sm text-gray-600">{category.parentCategoryId.name}</span>
                        ) : (
                          <span className="text-sm text-gray-400">Top Level</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {category.filters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {category.filters.slice(0, 3).map((filter, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                              >
                                {filter}
                              </span>
                            ))}
                            {category.filters.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{category.filters.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
                      setError('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Electronics, Clothing, Food"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category (Optional)
                  </label>
                  <select
                    value={formData.parentCategoryId}
                    onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">None (Top Level)</option>
                    {categories
                      .filter((c) => c._id !== editingCategory?._id)
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filters (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={formData.filters}
                    onChange={(e) => setFormData({ ...formData, filters: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., color, size, brand"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Product-specific filters for this category
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCategory(null);
                      setError('');
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
