'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Clock, IndianRupee, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AvailableShipment {
  _id: string;
  trackingNumber: string;
  status: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  customerName: string;
  customerPhone: string;
  orderId: {
    totalAmount: number;
    items: Array<{
      productId: {
        name: string;
        images: string[];
      };
      quantity: number;
    }>;
  };
  createdAt: string;
}

export default function AvailableShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<AvailableShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableShipments();
  }, []);

  const fetchAvailableShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/delivery/available');
      const data = await response.json();

      if (response.ok && data.success) {
        setShipments(data.data.shipments || []);
      } else {
        toast.error(data.message || 'Failed to fetch available shipments');
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast.error('Failed to load available shipments');
    } finally {
      setLoading(false);
    }
  };

  const acceptShipment = async (shipmentId: string) => {
    try {
      setAccepting(shipmentId);
      const response = await fetch('/api/delivery/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Shipment accepted! Redirecting to delivery details...');
        // Redirect to the delivery details page
        router.push(`/driver/delivery/${shipmentId}`);
      } else {
        toast.error(data.error || data.message || 'Failed to accept shipment');
      }
    } catch (error) {
      console.error('Error accepting shipment:', error);
      toast.error('Failed to accept shipment');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Deliveries</h1>
          <p className="text-gray-600">Accept deliveries and start earning</p>
        </div>

        {/* Shipments List */}
        {shipments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Available Deliveries</h2>
            <p className="text-gray-600">
              Check back later for new delivery opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div
                key={shipment._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-5 h-5 text-green-600" />
                      <h3 className="font-bold text-gray-900">
                        {shipment.trackingNumber}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        Available
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(shipment.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="text-2xl font-bold text-green-600 flex items-center justify-end gap-1">
                      <IndianRupee className="w-5 h-5" />
                      {shipment.orderId?.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {shipment.orderId?.items?.length || 0} item(s)
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 mb-1">Delivery Address:</p>
                      <p className="text-gray-600">
                        {shipment.deliveryAddress?.street || shipment.customerName}
                        <br />
                        {shipment.deliveryAddress?.city}, {shipment.deliveryAddress?.state}
                        <br />
                        {shipment.deliveryAddress?.zipCode}
                      </p>
                      {shipment.customerPhone && (
                        <p className="text-gray-600 mt-1">
                          Phone: {shipment.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                {shipment.orderId?.items && shipment.orderId.items.length > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                    <div className="space-y-1">
                      {shipment.orderId.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {item.productId?.name || 'Product'} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accept Button */}
                <button
                  onClick={() => acceptShipment(shipment._id)}
                  disabled={accepting === shipment._id}
                  className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {accepting === shipment._id ? 'Accepting...' : 'Accept Delivery'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchAvailableShipments}
            className="px-6 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
