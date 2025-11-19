'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  Truck,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrderDetails {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: {
    productId: {
      _id: string;
      name: string;
      images: string[];
      price: number;
      discount: number;
    };
    quantity: number;
  }[];
  status: string;
  totalAmount: number;
  taxAmount: number;
  shippingFee: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [resolvedParams.id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/seller/orders/${resolvedParams.id}`);
      const result = await response.json();

      if (result.success) {
        setOrder(result.data);
      } else {
        toast.error('Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/seller/orders/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrderDetails();
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'confirmed':
      case 'packed':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <button
            onClick={() => router.push('/seller/orders')}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => {
    const price = item.productId?.price || 0;
    const discount = item.productId?.discount || 0;
    const finalPrice = price - (price * discount / 100);
    return sum + (finalPrice * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/seller/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className={`mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          {/* Status Update Actions */}
          <div className="border-t pt-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Update Order Status:</p>
            <div className="flex flex-wrap gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Confirm Order
                </button>
              )}
              {order.status === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus('packed')}
                  disabled={updating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  Mark as Packed
                </button>
              )}
              {order.status === 'packed' && (
                <button
                  onClick={() => updateOrderStatus('shipped')}
                  disabled={updating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                >
                  Mark as Shipped
                </button>
              )}
              {['pending', 'confirmed'].includes(order.status) && (
                <button
                  onClick={() => updateOrderStatus('cancelled')}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Name</p>
              <p className="font-semibold text-gray-900">{order.userId.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {order.userId.email}
              </p>
            </div>
            {order.userId.phone && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {order.userId.phone}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </h2>
          <p className="text-gray-700">
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state}<br />
            {order.shippingAddress.zipCode}
          </p>
          {order.shippingAddress.phone && (
            <p className="text-gray-700 mt-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {order.shippingAddress.phone}
            </p>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item, idx) => {
              const price = item.productId?.price || 0;
              const discount = item.productId?.discount || 0;
              const finalPrice = price - (price * discount / 100);
              return (
                <div key={idx} className="flex gap-4 pb-4 border-b last:border-b-0">
                  {item.productId?.images?.[0] && (
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={item.productId.images[0]}
                        alt={item.productId.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.productId?.name || 'Unknown Product'}</h3>
                    <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                    {discount > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="line-through">₹{price.toFixed(2)}</span>
                        <span className="text-green-600 ml-2">{discount}% off</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{(finalPrice * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">₹{finalPrice.toFixed(2)} each</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax</span>
              <span>₹{order.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping Fee</span>
              <span>₹{order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-green-600">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
