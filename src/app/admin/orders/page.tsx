'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  PackageCheck,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyStateTableRow } from '@/components/ui/EmptyState';

interface Order {
  _id: string;
  userId: {
    name: string;
    email: string;
    phone?: string;
  };
  sellerId: {
    businessName: string;
    contactEmail: string;
  };
  items: Array<{
    productId: {
      name: string;
      images: string[];
      price: number;
    };
    quantity: number;
  }>;
  status: string;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  shipmentId?: {
    trackingNumber: string;
    status: string;
    deliveryPersonId?: string;
  };
  createdAt: string;
}

const AdminOrdersPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/admin/orders?status=${selectedStatus}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders);
        setStats(data.stats);
      } else {
        toast.error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router, fetchOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'packed':
        return <PackageCheck className="w-5 h-5 text-purple-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
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

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order._id.toLowerCase().includes(searchLower) ||
      order.userId.name.toLowerCase().includes(searchLower) ||
      order.sellerId.businessName.toLowerCase().includes(searchLower) ||
      order.shipmentId?.trackingNumber.toLowerCase().includes(searchLower)
    );
  });

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/4 skeleton-shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 skeleton-shimmer"></div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-8">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2 skeleton-shimmer"></div>
                  <div className="h-8 bg-gray-200 rounded w-12 skeleton-shimmer"></div>
                </div>
              ))}
            </div>
            
            {/* Search bar skeleton */}
            <div className="bg-white p-4 rounded-lg shadow-sm mt-6">
              <div className="h-10 bg-gray-200 rounded skeleton-shimmer"></div>
            </div>
            
            {/* Table skeleton */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-20 skeleton-shimmer"></div>
                  ))}
                </div>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 border-b flex gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                    <div key={j} className="h-4 bg-gray-200 rounded w-20 skeleton-shimmer"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            Order Management
          </h1>
          <p className="text-gray-600">Manage and track all orders</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'all' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setSelectedStatus('pending')}
          >
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'confirmed' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedStatus('confirmed')}
          >
            <p className="text-gray-600 text-sm">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'packed' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setSelectedStatus('packed')}
          >
            <p className="text-gray-600 text-sm">Packed</p>
            <p className="text-2xl font-bold text-purple-600">{stats.packed}</p>
          </div>
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'shipped' ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setSelectedStatus('shipped')}
          >
            <p className="text-gray-600 text-sm">Shipped</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.shipped}</p>
          </div>
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'delivered' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setSelectedStatus('delivered')}
          >
            <p className="text-gray-600 text-sm">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          </div>
          <div 
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow ${selectedStatus === 'cancelled' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setSelectedStatus('cancelled')}
          >
            <p className="text-gray-600 text-sm">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, customer, seller, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <EmptyStateTableRow 
                    colSpan={8} 
                    icon={ShoppingBag}
                    message="No orders found matching your filters"
                  />
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order._id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.userId.name}</div>
                        <div className="text-sm text-gray-500">{order.userId.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.sellerId.businessName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{order.totalAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.shipmentId?.trackingNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrdersPage;
