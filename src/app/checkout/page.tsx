'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Wallet, Building2, ShoppingBag } from 'lucide-react';

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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [processingPayment, setProcessingPayment] = useState(false);

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
        // Fetch actual product data from API
        fetch(`/api/products/${productId}`)
          .then(res => res.json())
          .then(product => {
            const checkoutItem: CheckoutItem = {
              id: product._id,
              name: product.name,
              image: product.images[0] || 'https://via.placeholder.com/200x200?text=Product',
              price: product.price - product.discount,
              quantity: quantity
            };
            setItems([checkoutItem]);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching product:', error);
            // Fallback to showing error or redirect
            alert('Product not found');
            router.push('/');
          });
      } else {
        // If no productId, try to fetch from cart
        fetch('/api/cart')
          .then(res => res.json())
          .then(cartData => {
            if (cartData.items && cartData.items.length > 0) {
              const checkoutItems: CheckoutItem[] = cartData.items.map((item: { productId: { _id: string; name: string; images: string[]; price: number; discount: number }; quantity: number }) => ({
                id: item.productId._id,
                name: item.productId.name,
                image: item.productId.images[0] || 'https://via.placeholder.com/200x200?text=Product',
                price: item.productId.price - item.productId.discount,
                quantity: item.quantity
              }));
              setItems(checkoutItems);
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

    // Simulate payment processing
    setTimeout(() => {
      // Show success alert
      alert('🎉 Payment Successful! Your order has been placed.');
      
      // Remove items from cart (in production, call API)
      // For now, just redirect to home
      setProcessingPayment(false);
      router.push('/');
    }, 2000);
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
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                    className="w-4 h-4 text-green-600"
                  />
                  <CreditCard size={24} className="text-gray-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Credit / Debit Card</p>
                    <p className="text-sm text-gray-600">Pay securely with your card</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'upi')}
                    className="w-4 h-4 text-green-600"
                  />
                  <Wallet size={24} className="text-gray-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">UPI</p>
                    <p className="text-sm text-gray-600">Pay via UPI apps</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                  <input
                    type="radio"
                    name="payment"
                    value="netbanking"
                    checked={paymentMethod === 'netbanking'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'netbanking')}
                    className="w-4 h-4 text-green-600"
                  />
                  <Building2 size={24} className="text-gray-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Net Banking</p>
                    <p className="text-sm text-gray-600">Pay through your bank</p>
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
