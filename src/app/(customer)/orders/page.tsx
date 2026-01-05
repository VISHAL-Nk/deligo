'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  RefreshCw,
  Eye,
  Download,
  Star,
  MapPin,
  Calendar,
  IndianRupee,
  Filter,
  Search,
  RotateCcw,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderItem {
  productId: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    returnPolicy?: {
      enabled: boolean;
      days: number;
      type: string;
    };
  };
  quantity: number;
}

interface ReturnRequest {
  requestedAt?: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
  processedAt?: string;
  adminNotes?: string;
}

interface Order {
  _id: string;
  sellerId: {
    businessName: string;
  };
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return-requested' | 'return-approved' | 'return-rejected';
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  shippingFee: number;
  currency: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  returnRequest?: ReturnRequest;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: {
    color: 'text-yellow-600 bg-yellow-100',
    icon: Clock,
    label: 'Order Pending'
  },
  confirmed: {
    color: 'text-blue-600 bg-blue-100',
    icon: CheckCircle,
    label: 'Order Confirmed'
  },
  packed: {
    color: 'text-purple-600 bg-purple-100',
    icon: Package,
    label: 'Order Packed'
  },
  shipped: {
    color: 'text-orange-600 bg-orange-100',
    icon: Truck,
    label: 'Shipped'
  },
  delivered: {
    color: 'text-green-600 bg-green-100',
    icon: CheckCircle,
    label: 'Delivered'
  },
  cancelled: {
    color: 'text-red-600 bg-red-100',
    icon: XCircle,
    label: 'Cancelled'
  },
  refunded: {
    color: 'text-gray-600 bg-gray-100',
    icon: RefreshCw,
    label: 'Refunded'
  },
  'return-requested': {
    color: 'text-amber-600 bg-amber-100',
    icon: RotateCcw,
    label: 'Return Requested'
  },
  'return-approved': {
    color: 'text-teal-600 bg-teal-100',
    icon: CheckCircle,
    label: 'Return Approved'
  },
  'return-rejected': {
    color: 'text-red-600 bg-red-100',
    icon: XCircle,
    label: 'Return Rejected'
  }
};

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returningOrder, setReturningOrder] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/orders');
      return;
    }
    
    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sellerId.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => 
        item.productId.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return matchesStatus && matchesSearch;
  });

  const getOrderProgress = (status: string) => {
    const steps = ['confirmed', 'packed', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);
    return currentIndex + 1;
  };

  const canCancelOrder = (order: Order) => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const canReturnOrder = (order: Order) => {
    // Can only return delivered orders
    if (order.status !== 'delivered') return false;
    
    // Check if return already requested
    if (order.returnRequest?.status) return false;
    
    const deliveredDate = new Date(order.updatedAt);
    const now = new Date();
    const daysSinceDelivery = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Check if any product allows returns
    const maxReturnDays = Math.max(...order.items.map(item => {
      const policy = item.productId.returnPolicy;
      if (!policy?.enabled || policy.type === 'no-return') return 0;
      return policy.days || 7;
    }));
    
    return daysSinceDelivery <= maxReturnDays;
  };

  const getReturnDaysRemaining = (order: Order) => {
    const deliveredDate = new Date(order.updatedAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const maxReturnDays = Math.max(...order.items.map(item => {
      const policy = item.productId.returnPolicy;
      if (!policy?.enabled || policy.type === 'no-return') return 0;
      return policy.days || 7;
    }));
    
    return Math.max(0, maxReturnDays - daysSinceDelivery);
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmToast = toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-medium">Cancel this order?</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const response = await fetch(`/api/orders/${orderId}/cancel`, {
                    method: 'POST',
                  });
                  
                  if (!response.ok) throw new Error('Failed to cancel order');
                  
                  toast.success('Order cancelled successfully');
                  fetchOrders();
                } catch (error) {
                  console.error('Error cancelling order:', error);
                  toast.error('Failed to cancel order');
                }
              }}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Keep Order
            </button>
          </div>
        </div>
      ),
      { duration: 10000 }
    );
    return confirmToast;
  };

  const openReturnModal = (orderId: string) => {
    setReturnOrderId(orderId);
    setReturnReason('');
    setReturnModalOpen(true);
  };

  const handleReturnOrder = async () => {
    if (!returnOrderId || returnReason.trim().length < 10) {
      toast.error('Please provide a reason for the return (at least 10 characters)');
      return;
    }

    setReturningOrder(true);
    try {
      const response = await fetch(`/api/orders/${returnOrderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: returnReason.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Return request submitted successfully');
        setReturnModalOpen(false);
        setReturnOrderId(null);
        setReturnReason('');
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
      toast.error('Failed to submit return request');
    } finally {
      setReturningOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-500" />
              My Orders
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, products, or sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
                <option value="return-requested">Return Requested</option>
                <option value="return-approved">Return Approved</option>
                <option value="return-rejected">Return Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your search'}
            </h2>
            <p className="text-gray-500 mb-6">
              {orders.length === 0 
                ? 'Start shopping to see your orders here'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrder === order._id;
              
              return (
                <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-gray-900">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                      </div>
                    </div>

                    {/* Return Status Badge */}
                    {order.returnRequest?.status && (
                      <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                        order.returnRequest.status === 'pending' ? 'bg-amber-50 text-amber-800' :
                        order.returnRequest.status === 'approved' ? 'bg-green-50 text-green-800' :
                        'bg-red-50 text-red-800'
                      }`}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            Return {order.returnRequest.status.charAt(0).toUpperCase() + order.returnRequest.status.slice(1)}
                          </p>
                          <p className="text-sm mt-1">
                            Reason: {order.returnRequest.reason}
                          </p>
                          {order.returnRequest.adminNotes && (
                            <p className="text-sm mt-1">
                              Note: {order.returnRequest.adminNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Items Preview */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-white">
                            <Image
                              src={item.productId.images[0] || '/placeholder-product.png'}
                              alt={item.productId.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              +{order.items.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          From <span className="font-medium">{order.sellerId.businessName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar (for active orders) */}
                    {['confirmed', 'packed', 'shipped', 'delivered'].includes(order.status) && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                          <span>Confirmed</span>
                          <span>Packed</span>
                          <span>Shipped</span>
                          <span>Delivered</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(getOrderProgress(order.status) / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </button>
                      
                      {order.status === 'delivered' && (
                        <button className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                          <Star className="w-4 h-4" />
                          Rate & Review
                        </button>
                      )}
                      
                      {canCancelOrder(order) && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Order
                        </button>
                      )}
                      
                      {canReturnOrder(order) && (
                        <button 
                          onClick={() => openReturnModal(order._id)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Return ({getReturnDaysRemaining(order)} days left)
                        </button>
                      )}
                      
                      <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4" />
                        Invoice
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Order Items */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                          <div className="space-y-4">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                                  <Image
                                    src={item.productId.images[0] || '/placeholder-product.png'}
                                    alt={item.productId.name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{item.productId.name}</h5>
                                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                  {item.productId.returnPolicy && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {item.productId.returnPolicy.enabled 
                                        ? `${item.productId.returnPolicy.days}-day ${item.productId.returnPolicy.type} policy`
                                        : 'No returns'
                                      }
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatPrice(item.productId.price * item.quantity)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatPrice(item.productId.price)} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary & Address */}
                        <div className="space-y-6">
                          {/* Shipping Address */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Delivery Address
                            </h4>
                            <div className="bg-white p-4 rounded-lg">
                              <p className="text-sm text-gray-700">
                                {order.shippingAddress.line1}
                                {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
                              </p>
                              <p className="text-sm text-gray-700">
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                              </p>
                              <p className="text-sm text-gray-700">
                                {order.shippingAddress.country}
                              </p>
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <IndianRupee className="w-4 h-4" />
                              Order Summary
                            </h4>
                            <div className="bg-white p-4 rounded-lg space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.totalAmount - order.taxAmount - order.shippingFee + order.discountAmount)}</span>
                              </div>
                              {order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                  <span>Discount</span>
                                  <span>-{formatPrice(order.discountAmount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : 'Free'}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Tax</span>
                                <span>{formatPrice(order.taxAmount)}</span>
                              </div>
                              <hr />
                              <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Order Timeline */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Order Timeline
                            </h4>
                            <div className="bg-white p-4 rounded-lg">
                              <div className="text-sm text-gray-600">
                                <p>Order placed: {formatDateTime(order.createdAt)}</p>
                                <p>Last updated: {formatDateTime(order.updatedAt)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Return</h3>
                <button 
                  onClick={() => setReturnModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for returning this order. Your return request will be reviewed by the seller.
                </p>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Why are you returning this order? (min 10 characters)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {returnReason.length}/10 minimum characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReturnOrder}
                  disabled={returningOrder || returnReason.trim().length < 10}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {returningOrder ? 'Submitting...' : 'Submit Return Request'}
                </button>
                <button
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}