'use client';

import Image from "next/image";

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
  const qty = 0;
  const updateQuantity = (productId: string, quantity: number) => {
    // TODO: Implement cart quantity update logic
    console.log('Update quantity:', productId, quantity);
  };
  const addToCart = (product: Product) => {
    // TODO: Implement add to cart logic
    console.log('Add to cart:', product);
  };

  return (
    <div className="border rounded-xl shadow-sm p-3 bg-white flex flex-col min-w-48 ">
      <Image
        src={product.images[0] || '/placeholder.png'}
        width={200}
        height={200}
        priority
        alt={product.name}
      />
      <h3 className="text-sm font-semibold line-clamp-2">{product.name}</h3>
      <div className="flex justify-between items-center mt-3">
        <span className="font-bold">₹{product.price}</span>
        {product.discount > 0 && (
          <span className="text-xs text-gray-500 line-through">
            ₹{product.price + product.discount}
          </span>
        )}

        {qty === 0 ? (
          <button
            onClick={() => addToCart(product)}
            className="bg-green-600 text-white text-sm px-3 py-1 rounded-md hover:bg-green-700"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 border border-green-600 rounded-md px-2 py-1">
            <button
              // FIX: Use product._id instead of product.id
              onClick={() => updateQuantity(product._id, -1)}
              className="text-green-600 font-bold text-lg px-1"
            >
              –
            </button>
            <span className="text-sm font-semibold">{qty}</span>
            <button
              onClick={() => updateQuantity(product._id, 1)}
              className="text-green-600 font-bold text-lg px-1"
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