'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, ArrowLeft, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProductReviews from '@/components/ProductReviews';
import toast from 'react-hot-toast';

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

export default function ProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + productId);
      return;
    }
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          quantity: quantity
        })
      });

      if (response.ok) {
        toast.success(`Added ${quantity} item(s) to cart!`);
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const handleBuyNow = () => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/products/' + productId);
      return;
    }
    
    router.push('/checkout?productId=' + productId + '&quantity=' + quantity);
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/products/${productId}`;
    
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success('Product link copied to clipboard!', {
        icon: <Check className="text-green-600" />,
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Back button skeleton */}
          <div className="h-6 bg-gray-200 rounded w-20 mb-6 skeleton-shimmer" />
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image gallery skeleton */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="h-96 bg-gray-200 rounded-lg mb-4 skeleton-shimmer" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded skeleton-shimmer" />
                  ))}
                </div>
              </div>
              {/* Features skeleton */}
              <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
                <div className="h-5 bg-gray-200 rounded w-1/3 skeleton-shimmer" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full skeleton-shimmer" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 skeleton-shimmer" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Product info skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
              <div className="h-4 bg-gray-200 rounded w-1/4 skeleton-shimmer" />
              <div className="flex items-center gap-4">
                <div className="h-10 bg-gray-200 rounded w-24 skeleton-shimmer" />
                <div className="h-6 bg-gray-200 rounded w-16 skeleton-shimmer" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
                <div className="h-4 bg-gray-200 rounded skeleton-shimmer" />
                <div className="h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer" />
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="h-10 bg-gray-200 rounded w-32 skeleton-shimmer" />
              </div>
              <div className="flex gap-4 pt-4">
                <div className="h-12 bg-gray-200 rounded flex-1 skeleton-shimmer" />
                <div className="h-12 bg-gray-200 rounded flex-1 skeleton-shimmer" />
              </div>
              <div className="flex gap-2 pt-4">
                <div className="h-10 w-10 bg-gray-200 rounded skeleton-shimmer" />
                <div className="h-10 w-10 bg-gray-200 rounded skeleton-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <button
            onClick={() => router.push('/')}
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  const finalPrice = product.price - product.discount;
  const discountPercentage = Math.round((product.discount / product.price) * 100);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="relative h-96 mb-4">
                <Image
                  src={product.images[selectedImage] || 'https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png'}
                  alt={product.name}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEEAQQDAAAAAAAAAAAAAQIDAAQFESExBhITQWGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/ANHsOodVjrWO2t7iQRRqFQF2J0PAHT6qfc9U5e7uZZ5rm4eSVizs1w+yT+YpSlPZdYNwf//Z"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-20 border-2 rounded-md overflow-hidden transition-all ${
                      selectedImage === index ? 'border-green-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Why Buy This?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Truck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Free Delivery</p>
                    <p className="text-sm text-gray-600">On orders above ₹500</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <RotateCcw size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Easy Returns</p>
                    <p className="text-sm text-gray-600">7 days return policy</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Secure Payment</p>
                    <p className="text-sm text-gray-600">100% secure transactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-sm">
                  <Star size={14} fill="white" />
                  <span>4.5</span>
                </div>
                <span className="text-gray-600 text-sm">(1,234 ratings)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-green-600">₹{finalPrice}</span>
                {product.discount > 0 && (
                  <>
                    <span className="text-2xl text-gray-400 line-through">₹{product.price}</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {discountPercentage}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              {product.stock > 0 ? (
                <p className="text-green-600 font-medium mb-4">In Stock ({product.stock} available)</p>
              ) : (
                <p className="text-red-600 font-medium mb-4">Out of Stock</p>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-6 py-2 font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-gray-600 text-sm">Max: {product.stock}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  disabled={product.stock === 0}
                >
                  Buy Now
                </button>
              </div>

              {/* Wishlist & Share */}
              <div className="flex gap-4">
                <button className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Heart size={20} />
                  Wishlist
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Product Description</h2>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Specifications</h2>
                <div className="space-y-2">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex border-b border-gray-100 pb-2">
                      <span className="font-medium text-gray-700 w-1/3">{key}</span>
                      <span className="text-gray-600 w-2/3">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={productId} />
        </div>
      </div>
    </div>
  );
}
