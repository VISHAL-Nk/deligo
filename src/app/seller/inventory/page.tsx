'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, TrendingDown, Search, Download } from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  reserved: number;
  lowStockThreshold: number;
  price: number;
  images: string[];
}

interface InventoryLog {
  _id: string;
  productId: {
    name: string;
    sku: string;
  };
  changeType: string;
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'logs'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, logsRes] = await Promise.all([
        fetch('/api/seller/inventory'),
        fetch('/api/seller/inventory/logs?limit=50'),
      ]);

      // Check if responses are ok before parsing JSON
      const parseJSON = async (response: Response, defaultValue: unknown = null) => {
        if (!response.ok) {
          console.error(`API error: ${response.status} ${response.statusText}`);
          return { success: false, data: defaultValue };
        }
        try {
          return await response.json();
        } catch (error) {
          console.error('JSON parse error:', error);
          return { success: false, data: defaultValue };
        }
      };

      const [productsData, logsData] = await Promise.all([
        parseJSON(productsRes, []),
        parseJSON(logsRes, []),
      ]);

      if (productsData.success) {
        setProducts(productsData.products || productsData.data?.products || []);
      } else {
        setProducts([]);
      }
      
      if (logsData.success) {
        setLogs(logsData.logs || logsData.data?.logs || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setProducts([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateStock = async (productId: string, newStock: number, reason: string) => {
    try {
      const response = await fetch('/api/seller/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stock: newStock, reason }),
      });

      if (response.ok) {
        fetchInventory();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const filteredProducts = (products || []).filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'low') return matchesSearch && product.stock <= product.lowStockThreshold;
    if (filter === 'out') return matchesSearch && product.stock === 0;
    return matchesSearch;
  });

  const stockStats = {
    total: (products || []).length,
    lowStock: (products || []).filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length,
    outOfStock: (products || []).filter((p) => p.stock === 0).length,
    totalValue: (products || []).reduce((sum, p) => sum + p.stock * p.price, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600 mt-1">Track and manage your product stock</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stockStats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stockStats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stockStats.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stockStats.totalValue.toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-6 py-3 font-semibold ${
                  activeTab === 'stock'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Stock Levels
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-3 font-semibold ${
                  activeTab === 'logs'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Activity Logs
              </button>
            </div>
          </div>

          {activeTab === 'stock' && (
            <div className="p-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Products</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              {/* Products Table */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Available</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Reserved</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="py-4 px-4 text-gray-700">{product.sku}</td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-semibold text-gray-900">{product.stock}</span>
                          </td>
                          <td className="py-4 px-4 text-right text-gray-700">{product.reserved}</td>
                          <td className="py-4 px-4 text-right">
                            {product.stock === 0 ? (
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                Out of Stock
                              </span>
                            ) : product.stock <= product.lowStockThreshold ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right text-gray-700">
                            ₹{(product.stock * product.price).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="p-6">
              {(logs || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No inventory activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(logs || []).map((log) => (
                    <div key={log._id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.changeType === 'increase' ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        <Package
                          className={`w-5 h-5 ${
                            log.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{log.productId.name}</h4>
                            <p className="text-sm text-gray-600">SKU: {log.productId.sku}</p>
                          </div>
                          <span
                            className={`text-lg font-bold ${
                              log.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {log.changeType === 'increase' ? '+' : '-'}
                            {Math.abs(log.quantityChanged)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          Stock changed from {log.previousStock} to {log.newStock}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">{log.reason}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
