'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  discount: number;
  quantity: number;
  stock: number;
}

const CartPage = () => {
  const router = useRouter();
  const { status } = useSession();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/cart');
      return;
    }

    if (status === 'authenticated') {
      // Fetch actual cart data from API
      fetch('/api/cart')
        .then(res => res.json())
        .then(data => {
          if (data.items && Array.isArray(data.items)) {
            const formattedItems: CartItem[] = data.items
              .filter((item: {
                productId: {
                  _id: string;
                  name: string;
                  images: string[];
                  price: number;
                  discount: number;
                  stock: number;
                } | null;
                quantity: number;
              }) => item.productId !== null) // Filter out items with null productId
              .map((item: {
                productId: {
                  _id: string;
                  name: string;
                  images: string[];
                  price: number;
                  discount: number;
                  stock: number;
                };
                quantity: number;
              }) => ({
                id: item.productId._id,
                name: item.productId.name,
                image: item.productId.images[0] || 'https://via.placeholder.com/200x200?text=Product',
                price: item.productId.price,
                discount: item.productId.discount,
                quantity: item.quantity,
                stock: item.productId.stock
              }));
            setCartItems(formattedItems);
          } else {
            setCartItems([]);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching cart:', error);
          setCartItems([]);
          setLoading(false);
        });
    }
  }, [status, router]);

  const updateQuantity = async (id: string, change: number) => {
    const item = cartItems.find(item => item.id === id);
    if (!item) return;

    const newQuantity = Math.max(1, Math.min(item.stock, item.quantity + change));
    
    // Optimistically update UI
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );

    // Update quantity in backend
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          quantity: newQuantity
        })
      });

      if (!response.ok) {
        // Revert on error
        setCartItems(prevItems =>
          prevItems.map(item => {
            if (item.id === id) {
              return { ...item, quantity: item.quantity };
            }
            return item;
          })
        );
        toast.error('Failed to update cart. Please try again.');
      } else {
        // Trigger cart count refresh
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart. Please try again.');
    }
  };

  const removeItem = async (id: string) => {
    // Optimistically update UI
    const removedItem = cartItems.find(item => item.id === id);
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));

    // Remove item from backend by setting quantity to 0
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          quantity: 0
        })
      });

      if (!response.ok) {
        // Revert on error
        if (removedItem) {
          setCartItems(prevItems => [...prevItems, removedItem]);
        }
        toast.error('Failed to remove item. Please try again.');
      } else {
        // Trigger cart count refresh
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      if (removedItem) {
        setCartItems(prevItems => [...prevItems, removedItem]);
      }
      toast.error('Failed to remove item. Please try again.');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const tax = Math.round(subtotal * 0.05); // 5% tax
  const total = subtotal + deliveryFee + tax;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    router.push('/checkout');
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
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Continue Shopping</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shopping Cart</h1>
        <p className="text-gray-600 mb-8">{cartItems.length} items in your cart</p>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some items to get started!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const itemTotal = (item.price - item.discount) * item.quantity;
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">₹{item.price - item.discount}</span>
                              {item.discount > 0 && (
                                <span className="text-sm text-gray-400 line-through">₹{item.price}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border-2 border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="px-4 py-1 font-semibold min-w-[40px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Item Total</p>
                            <p className="font-bold text-gray-800">₹{itemTotal}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
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
                  onClick={handleCheckout}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  Proceed to Checkout
                </button>

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
        )}
      </div>
    </div>
  );
};

export default CartPage;
