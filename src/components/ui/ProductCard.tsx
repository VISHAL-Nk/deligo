'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { handleError, ERROR_MESSAGES } from "@/lib/api-utils";

// Your Product interface here...
interface Product {
  _id: string;
  sellerId: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  currency: string;
  discount: number;
  images: string[];
  attributes: Record<string, unknown>;
  stock: number;
  reserved: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}


const ProductCard = ({ product }: { product: Product }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [qty, setQty] = useState(0);
  const [loading, setLoading] = useState(false);

  const updateCartAPI = async (productId: string, newQty: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: newQty
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || ERROR_MESSAGES.CART_UPDATE_FAILED;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, change: number) => {
    // Check if user is logged in
    if (!session) {
      router.push('/auth/signin?callbackUrl=/');
      return;
    }

    const newQty = Math.max(0, qty + change);
    const previousQty = qty;
    
    // Optimistic update
    setQty(newQty);
    
    try {
      await updateCartAPI(productId, newQty);
      // Trigger cart count refresh
      window.dispatchEvent(new Event('cartUpdated'));
      if (newQty === 0) {
        toast.success('Item removed from cart');
      }
    } catch (error) {
      // Revert on error
      setQty(previousQty);
      handleError(error, true);
    }
  };

  const addToCart = async (product: Product) => {
    // Check if user is logged in
    if (!session) {
      router.push('/auth/signin?callbackUrl=/');
      return;
    }

    // Check stock availability
    if (product.stock <= 0) {
      toast.error('Sorry, this item is out of stock');
      return;
    }

    try {
      await updateCartAPI(product._id, 1);
      setQty(1);
      // Trigger cart count refresh
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      handleError(error, true);
    }
  };

  const finalPrice = product.price - product.discount;
  const discountPercentage = product.discount > 0 ? Math.round((product.discount / product.price) * 100) : 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="border rounded-xl shadow-sm p-3 bg-white flex flex-col min-w-48 hover:shadow-md transition-shadow relative">
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
          {discountPercentage}% OFF
        </div>
      )}
      
      {/* Stock Badge */}
      {isOutOfStock && (
        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
          Out of Stock
        </div>
      )}
      {isLowStock && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
          Only {product.stock} left
        </div>
      )}
      
      <Link href={`/products/${product._id}`} className="w-full h-48 mb-3 overflow-hidden rounded-lg cursor-pointer">
        <Image
          src={product.images[0] || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png'}
          width={200}
          height={200}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEEAQQDAAAAAAAAAAAAAQIDAAQFESExBhITQWGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/ANHsOodVjrWO2t7iQRRqFQF2J0PAHT6qfc9U5e7uZZ5rm4eSVizs1w+yT+YpSlPZdYNwf//Z"
          alt={product.name}
          className={`w-full h-full object-cover hover:scale-105 transition-transform ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        
      </Link>
      
      <Link href={`/products/${product._id}`} className="hover:text-green-600 transition-colors">
        <h3 className="text-sm font-semibold line-clamp-2 mb-2">{product.name}</h3>
      </Link>

      <div className="flex justify-between items-center mt-auto">
        <div className="flex flex-col">
          <span className="font-bold text-green-600">₹{finalPrice}</span>
          {product.discount > 0 && (
            <span className="text-xs text-gray-500 line-through">
              ₹{product.price}
            </span>
          )}
        </div>

        {qty === 0 ? (
          <button
            onClick={() => addToCart(product)}
            disabled={loading || isOutOfStock}
            className="bg-green-600 text-white text-sm px-3 py-1 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : isOutOfStock ? 'Unavailable' : 'ADD'}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 border border-green-600 rounded-md px-2 py-1">
            <button
              onClick={() => updateQuantity(product._id, -1)}
              disabled={loading}
              className="text-green-600 font-bold text-lg px-1 hover:text-green-700 disabled:opacity-50"
            >
              –
            </button>
            <span className="text-sm font-semibold min-w-[20px] text-center">{qty}</span>
            <button
              onClick={() => updateQuantity(product._id, 1)}
              disabled={loading || qty >= product.stock}
              className="text-green-600 font-bold text-lg px-1 hover:text-green-700 disabled:opacity-50"
              title={qty >= product.stock ? 'Max stock reached' : 'Add one more'}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;