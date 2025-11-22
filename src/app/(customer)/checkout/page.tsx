'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Wallet, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key?: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface CheckoutItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{ orderId: string; trackingNumber: string; totalAmount?: number }[] | null>(null);
  const [purchaseMode, setPurchaseMode] = useState<'cart' | 'direct'>('cart');
  const [shippingAddress] = useState({
    street: '123 Main Street, Apartment 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    phone: '+91 1234567890'
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/checkout');
      return;
    }

    if (status === 'authenticated') {
      const productId = searchParams.get('productId');
      const quantity = parseInt(searchParams.get('quantity') || '1');

      if (productId) {
        // Direct purchase mode
        setPurchaseMode('direct');
        // Fetch actual product data from API
        fetch(`/api/products/${productId}`)
          .then(res => res.json())
          .then(product => {
            const checkoutItem: CheckoutItem = {
              id: product._id,
              name: product.name,
              image: product.images[0] || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png',
              price: product.price - product.discount,
              quantity: quantity
            };
            setItems([checkoutItem]);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching product:', error);
            toast.error('Product not found');
            router.push('/');
          });
      } else {
        // Cart purchase mode
        setPurchaseMode('cart');
        // If no productId, try to fetch from cart
        fetch('/api/cart')
          .then(res => res.json())
          .then(cartData => {
            if (cartData.items && cartData.items.length > 0) {
              const checkoutItems: CheckoutItem[] = cartData.items.map((item: { productId: { _id: string; name: string; images: string[]; price: number; discount: number }; quantity: number }) => ({
                id: item.productId._id,
                name: item.productId.name,
                image: item.productId.images[0] || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png',
                price: item.productId.price - item.productId.discount,
                quantity: item.quantity
              }));
              setItems(checkoutItems);
            } else {
              toast.error('Your cart is empty');
              router.push('/');
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching cart:', error);
            setLoading(false);
          });
      }
    }
  }, [status, router, searchParams]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + deliveryFee + tax;
  
  const handlePayment = async () => {
    setProcessingPayment(true);

    try {
      if (paymentMethod === 'cod') {
        // Process Cash on Delivery
        const requestBody: {
          shippingAddress: typeof shippingAddress;
          paymentMethod: string;
          items?: { productId: string; quantity: number }[];
        } = {
          shippingAddress,
          paymentMethod: 'cod'
        };

        // If direct purchase, include items data
        if (purchaseMode === 'direct') {
          requestBody.items = items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }));
        }

        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (response.ok) {
          setProcessingPayment(false);
          setOrderConfirmed(true);
          setOrderDetails(data.orders);
          toast.success('✅ Order Confirmed! You will pay on delivery.', { duration: 4000 });
          if (data.orders && data.orders.length > 0) {
            toast.success(`📦 Order ID: ${data.orders[0].orderId.toString().slice(-8).toUpperCase()}`, { duration: 5000 });
          }
          window.dispatchEvent(new Event('cartUpdated'));
          setTimeout(() => {
            router.push('/');
          }, 4000);
        } else {
          setProcessingPayment(false);
          toast.error(data.error || 'Order failed. Please try again.');
        }
      } else {
        // Process Razorpay Payment
        const response = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            shippingAddress
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || 'Failed to initiate payment');
          setProcessingPayment(false);
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: 'Deligo',
          description: 'Order Payment',
          order_id: data.razorpayOrderId,
          handler: async function (response: RazorpayResponse) {
            try {
              // Verify payment and create order
              const verifyBody: {
                razorpay_order_id: string;
                razorpay_payment_id: string;
                razorpay_signature: string;
                shippingAddress: typeof shippingAddress;
                items?: { productId: string; quantity: number }[];
              } = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress
              };

              // If direct purchase, include items data
              if (purchaseMode === 'direct') {
                verifyBody.items = items.map(item => ({
                  productId: item.id,
                  quantity: item.quantity
                }));
              }

              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(verifyBody),
              });

              const verifyData = await verifyResponse.json();

              if (verifyResponse.ok) {
                // Show success messages
                setOrderConfirmed(true);
                setOrderDetails(verifyData.orders);
                toast.success('✅ Payment Successful!', { duration: 3000 });
                toast.success('📦 Order Confirmed!', { duration: 4000 });
                
                // Show order details if available
                if (verifyData.orders && verifyData.orders.length > 0) {
                  const orderId = verifyData.orders[0].orderId.toString().slice(-8).toUpperCase();
                  const trackingNumber = verifyData.orders[0].trackingNumber;
                  toast.success(`Order ID: ${orderId}`, { duration: 5000 });
                  toast.success(`Tracking: ${trackingNumber}`, { duration: 5000 });
                }
                
                window.dispatchEvent(new Event('cartUpdated'));
                setTimeout(() => {
                  router.push('/');
                }, 4000);
              } else {
                toast.error(verifyData.error || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error('Payment verification failed');
            } finally {
              setProcessingPayment(false);
            }
          },
          prefill: {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
            contact: shippingAddress.phone
          },
          theme: {
            color: '#16a34a'
          },
          modal: {
            ondismiss: function() {
              setProcessingPayment(false);
              toast.error('Payment cancelled');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setProcessingPayment(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-gray-200 h-32 rounded-lg"></div>
                <div className="bg-gray-200 h-32 rounded-lg"></div>
              </div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Section - Order Items & Payment Method */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ShoppingBag size={24} />
                Order Items
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                      <p className="font-bold text-green-600 mt-1">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Delivery Address</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-800">{session?.user?.name || 'User'}</p>
                
                <p className="text-gray-600 text-sm mt-2">
                  123 Main Street, Apartment 4B<br />
                  Mumbai, Maharashtra 400001<br />
                  India
                </p>
                <p className="text-gray-600 text-sm mt-2">Phone: +91 1234567890</p>
              </div>
              <button className="mt-4 text-green-600 hover:text-green-700 font-semibold text-sm">
                Change Address
              </button>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                    className="w-4 h-4 text-green-600"
                  />
                  <CreditCard size={24} className="text-gray-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Razorpay (UPI, Cards, Wallets)</p>
                    <p className="text-sm text-gray-600">Pay securely via Razorpay</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                    className="w-4 h-4 text-green-600"
                  />
                  <Wallet size={24} className="text-gray-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when you receive</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="pt-3 border-t-2 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-green-600">₹{total}</span>
                </div>
              </div>

              {deliveryFee > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-yellow-800">
                    Add items worth ₹{500 - subtotal} more to get FREE delivery!
                  </p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processingPayment ? 'Processing...' : `Pay ₹${total}`}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  By placing this order, you agree to our Terms & Conditions
                </p>
              </div>

              {/* Benefits */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>100% Secure Payments</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>Easy Returns & Refunds</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation Overlay */}
      {orderConfirmed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-[fadeIn_0.3s_ease-in-out]">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
              <p className="text-gray-600">Thank you for your purchase</p>
            </div>

            {orderDetails && orderDetails.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-900">
                    {orderDetails[0].orderId.toString().slice(-8).toUpperCase()}
                  </span>
                </div>
                {orderDetails[0].trackingNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tracking Number:</span>
                    <span className="font-semibold text-gray-900">
                      {orderDetails[0].trackingNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-green-600">
                    ₹{orderDetails[0].totalAmount?.toFixed(2) || total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-6">
              You will receive an email confirmation shortly. Redirecting to home...
            </p>

            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CheckoutPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-gray-200 h-32 rounded-lg"></div>
                <div className="bg-gray-200 h-32 rounded-lg"></div>
              </div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
};

export default CheckoutPage;
