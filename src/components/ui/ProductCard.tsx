'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

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
  attributes: {
    author: string;
    language: string;
    genre: string;
    pages: number;
  };
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

  const updateQuantity = (productId: string, change: number) => {
    // Check if user is logged in
    if (!session) {
      router.push('/auth/signin?callbackUrl=/');
      return;
    }

    const newQty = Math.max(0, qty + change);
    setQty(newQty);

    // TODO: Implement cart quantity update logic via API
    console.log('Update quantity:', productId, newQty);
  };

  const addToCart = (product: Product) => {
    // Check if user is logged in
    if (!session) {
      router.push('/auth/signin?callbackUrl=/');
      return;
    }

    setQty(1);
    // TODO: Implement add to cart logic via API
    console.log('Add to cart:', product);
  };

  const finalPrice = product.price - product.discount;

  return (
    <div className="border rounded-xl shadow-sm p-3 bg-white flex flex-col min-w-48 hover:shadow-md transition-shadow">
      <Link href={`/products/${product._id}`} className="w-full h-48 mb-3 overflow-hidden rounded-lg cursor-pointer">
        <Image
          src={product.images[0] || '/placeholder.png'}
          width={200}
          height={200}
          priority
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
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
            className="bg-green-600 text-white text-sm px-3 py-1 rounded-md hover:bg-green-700 transition-colors"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 border border-green-600 rounded-md px-2 py-1">
            <button
              onClick={() => updateQuantity(product._id, -1)}
              className="text-green-600 font-bold text-lg px-1 hover:text-green-700"
            >
              –
            </button>
            <span className="text-sm font-semibold min-w-[20px] text-center">{qty}</span>
            <button
              onClick={() => updateQuantity(product._id, 1)}
              className="text-green-600 font-bold text-lg px-1 hover:text-green-700"
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