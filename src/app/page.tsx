import { Suspense } from "react";
import ProductCard from "@/components/ui/ProductCard";
import axios from "axios";
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";

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

// 🔹 Skeleton grid for suspense fallback
const ProductsSkeleton = () => {
  return (
    <div className="p-4 flex gap-2 w-full overflow-scroll overflow-y-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="border rounded-xl shadow-sm p-3 bg-white flex flex-col min-w-48 animate-pulse"
        >
          <div className="bg-gray-200 h-48 w-full rounded-md"></div>
          <div className="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="mt-2 h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="mt-4 flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 🔹 Separate component for fetching + rendering products
async function ProductsList() {
    const products = [
    {
      _id: '68d66156422d71b9d3939549',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939542',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939541',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939540',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939545',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939544',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939503',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d39395413',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939533',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
    {
      _id: '68d66156422d71b9d3939523',
      sellerId: '68d66156422d71b9d3939546',
      sku: 'TSHIRT-MED-RED',
      name: 'Cotton T-Shirt Red Medium',
      description: 'Premium cotton t-shirt in red color, size medium',
      categoryId: '68d66156422d71b9d3939544',
      price: 999,
      currency: 'INR',
      discount: 100,
      images: [],
      attributes: {
        author: 'Unknown Author',
        language: 'English',
        genre: 'Fashion',
        pages: 1
      },
      stock: 100,
      reserved: 0,
      status: 'active',
      createdAt: '2025-09-26T09:48:06.528Z',
      updatedAt: '2025-09-26T09:48:06.528Z'
    },
  ];
  
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/products`;

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await axios.get(url, {
      headers: { Cookie: cookieHeader },
    });

    // products = response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="p-4 flex gap-2 w-full overflow-scroll overflow-y-hidden">
      {Array.isArray(products) &&
        products.map((product: Product) => (
          <ProductCard key={product._id} product={product} />
        ))}
    </div>
  );
}

const Page = () => {
  
  const navigationLinks = [
    { name: "Home", href: "/" },
    { name: "Category", href: "/category" },
    { name: "Cart", href: "/cart" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <>
      <div className="bg-green-500 p-4 gap-5 text-white flex items-center">
        {navigationLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="py-1 px-3 bg-green-600 rounded-2xl"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* 🔹 Suspense applied here */}
      <Suspense fallback={<ProductsSkeleton />}>
        {/* Async data-fetching section */}
        <ProductsList />
      </Suspense>
    </>
  );
};

export default Page;
