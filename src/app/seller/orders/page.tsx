'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Search,
  Download,
  Eye,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

interface Order {
  _id: string;
  orderId: string;
  userId: {
    name: string;
    email: string;
  };
  items: {
    productId: {
      name: string;
      images: string[];
      price: number;
      discount: number;
    };
    quantity: number;
  }[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode?: string;
    postalCode?: string;
  };
  createdAt: string;
}

import { LucideIcon } from 'lucide-react';

const statusColors: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
  packed: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Package },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/seller/orders?${params}`);
      const result = await response.json();

      if (result.success) {
        // Handle nested data structure from API
        const data = result.data || {};
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">Manage and fulfill customer orders</p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export Orders
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(orders || []).filter((o) => o.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(orders || []).filter((o) => o.status === 'processing').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {(orders || []).filter((o) => o.status === 'shipped').length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-indigo-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {(orders || []).filter((o) => o.status === 'delivered').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
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
                  placeholder="Search by order ID or customer..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (orders || []).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm">
            <EmptyState 
              variant="orders"
              title="No orders found"
              description={searchTerm ? 'Try adjusting your search terms or filters' : 'Orders will appear here once customers place them'}
              ctaText={searchTerm ? 'Clear Search' : undefined}
              onCtaClick={searchTerm ? () => setSearchTerm('') : undefined}
            />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {(orders || []).map((order) => {
                const StatusIcon = statusColors[order.status]?.icon || Package;
                return (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">#{order.orderId}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusColors[order.status]?.bg} ${statusColors[order.status]?.text}`}>
                              <StatusIcon className="w-3 h-3" />
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.userId.name} • {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">₹{order.totalAmount?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">{order.items.length} item(s)</p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        {order.items.map((item, idx) => {
                          const itemPrice = item.productId?.price || 0;
                          const itemDiscount = item.productId?.discount || 0;
                          const finalPrice = itemPrice - itemDiscount;
                          return (
                            <div key={idx} className="flex items-center gap-4 py-2">
                              <div className="text-sm text-gray-700 flex-1">
                                {item.productId?.name || 'Unknown Product'} × {item.quantity}
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                ₹{(finalPrice * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Shipping Address */}
                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Shipping Address:</p>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                          {order.shippingAddress.state} - {order.shippingAddress.zipCode || order.shippingAddress.postalCode || ''}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Link
                          href={`/seller/orders/${order._id}`}
                          className="flex-1 md:flex-none px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-center flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                        
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'confirmed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Confirm Order
                          </button>
                        )}
                        
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'packed')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Mark as Packed
                          </button>
                        )}
                        
                        {order.status === 'packed' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'shipped')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Mark as Shipped
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
