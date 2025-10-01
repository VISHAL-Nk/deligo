import { Suspense } from "react";
import ProductCard from "@/components/ui/ProductCard";
import axios from "axios";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
  Shirt,
  Smartphone,
  Book,
  Home,
  Sparkles,
  Trophy,
  ChevronRight,
  ArrowRight
} from "lucide-react";

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

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
const heroConfig = {
  title: "Big Savings Festival",
  content: "Discounts up to 60% on electronics, fashion & more!",
  ctaText: "Explore Deals",
  ctaLink: "/products",
  image: {
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    alt: "Festival Offers",
    position: "right" // left, right, center
  }
}

// Featured Categories Configuration  
const featuredCategories = [
  { name: "Fashion", icon: Shirt, href: "/products?category=fashion" },
  { name: "Electronics", icon: Smartphone, href: "/products?category=electronics" },
  { name: "Books", icon: Book, href: "/products?category=books" },
  { name: "Home & Kitchen", icon: Home, href: "/products?category=home" },
  { name: "Beauty", icon: Sparkles, href: "/products?category=beauty" },
  { name: "Sports", icon: Trophy, href: "/products?category=sports" },
];

// 🔹 Skeleton grid for suspense fallback
const ProductsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
           className="border rounded-xl shadow-sm p-3 bg-white flex flex-col animate-pulse"
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

    await axios.get(url, {
      headers: { Cookie: cookieHeader },
    });

    // products = response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.isArray(products) &&
        products.slice(0, 6).map((product: Product) => (
          <ProductCard key={product._id} product={product} />
        ))}
    </div>
  );
}

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-green-100 to-green-200 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className={`${heroConfig.image.position === 'right' ? 'order-1' : 'order-2'}`}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
              {heroConfig.title}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              {heroConfig.content}
            </p>
            <Link
              href={heroConfig.ctaLink}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              data-testid="explore-deals-btn"
            >
              {heroConfig.ctaText}
              <ArrowRight size={20} />
            </Link>
          </div>
          <div className={`${heroConfig.image.position === 'right' ? 'order-2' : 'order-1'} flex justify-center`}>
            <Image
              src={heroConfig.image.src}
              alt={heroConfig.image.alt}
              width={400}
              height={400}
              className="w-full max-w-md rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Featured Categories Component
const FeaturedCategories = () => {
  const displayCategories = featuredCategories.slice(0, 6);
  const hasMoreCategories = featuredCategories.length > 6;

  return (
    <section className="py-12 px-4" data-testid="featured-categories">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Featured Categories</h2>
          {hasMoreCategories && (
            <Link
              href="/categories"
              className="flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
              data-testid="view-all-categories-btn"
            >
              View All
              <ChevronRight size={20} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {displayCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={index}
                href={category.href}
                className="flex flex-col items-center p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                data-testid={`category-${category.name.toLowerCase().replace(' ', '-')}`}
              >
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-700 transition-colors">
                  <Icon size={28} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 text-center">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Limited Time Offers Component
const LimitedTimeOffers = () => {
  const offers = [
    {
      id: 1,
      name: "Cotton T-Shirt",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop",
      discount: "40% OFF",
      originalPrice: 1500,
      salePrice: 900
    },
    {
      id: 2,
      name: "Wireless Headphones",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      discount: "38% OFF",
      originalPrice: 2500,
      salePrice: 1550
    },
    {
      id: 3,
      name: "Designer Handbag",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop",
      discount: "30% OFF",
      originalPrice: 3000,
      salePrice: 2100
    }
  ];

  return (
    <>
      <section className="bg-green-600 py-12 px-4" data-testid="limited-time-offers">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Limited Time Offers
              </h2>
              <p className="text-green-100 text-lg mb-6">
                Hurry up! Grab these exclusive discounts before they&apos;re gone.
              </p>
              <Link
                href="/products?offers=true"
                className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                data-testid="shop-now-btn"
              >
                Shop Now
                <ArrowRight size={20} />
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto">
              {offers.map((offer) => (
                <div key={offer.id} className="flex-shrink-0 bg-white rounded-lg p-4 min-w-48">
                  <div className="relative mb-4">
                    <Image
                      src={offer.image}
                      alt={offer.name}
                      width={192}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-black text-xs font-bold px-2 py-1 rounded shadow-md">
                      {offer.discount}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-3 text-sm line-clamp-2">{offer.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600 text-sm">₹{offer.salePrice}</span>
                    <span className="text-xs text-gray-500 line-through">₹{offer.originalPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const Page = () => {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Limited Time Offers */}
      <LimitedTimeOffers />

      {/* Featured Products Section */}
      <section className="py-12 px-4 bg-gray-50" data-testid="featured-products">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Featured Products</h2>
          <Suspense fallback={<ProductsSkeleton />}>
            {/* Async data-fetching section */}
            <ProductsList />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default Page;
