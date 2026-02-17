import { Suspense } from "react";
import ProductCard from "@/components/ui/ProductCard";
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
import ProductRecommendations from "@/components/ProductRecommendations";
import UserRecentlyViewed from "@/components/UserRecentlyViewed";
import AdBanner from "@/components/ads/AdBanner";
import SidebarAds from "@/components/ads/SidebarAds";

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
          className="border rounded-xl shadow-sm p-3 bg-white flex flex-col"
        >
          <div className="bg-gray-200 h-48 w-full rounded-md skeleton-shimmer"></div>
          <div className="mt-3 h-4 bg-gray-200 rounded w-3/4 skeleton-shimmer"></div>
          <div className="mt-2 h-4 bg-gray-200 rounded w-1/2 skeleton-shimmer"></div>
          <div className="mt-4 flex justify-between items-center">
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 rounded w-16 skeleton-shimmer"></div>
              <div className="h-3 bg-gray-200 rounded w-12 skeleton-shimmer"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 skeleton-shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 🔹 Separate component for fetching + rendering products
async function ProductsList() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    // Remove trailing slash if present and ensure no /api prefix in base URL
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
    const url = `${cleanBaseUrl}/api/products/public`;

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(url, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Received non-JSON response:', await response.text());
      throw new Error('Invalid response format');
    }

    const products: Product[] = await response.json();

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {Array.isArray(products) &&
          products.slice(0, 8).map((product: Product) => (
            <ProductCard key={product._id} product={product} />
          ))}
      </div>
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return (
      <div className="text-center py-10 text-gray-600">
        <p>Unable to load products at the moment.</p>
      </div>
    );
  }
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
              priority
              sizes="(max-width: 768px) 100vw, 400px"
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

// Helper to check if user is logged in on the server side
async function isUserLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  // next-auth stores the session token in this cookie
  const sessionToken = cookieStore.get("next-auth.session-token") || cookieStore.get("__Secure-next-auth.session-token");
  return !!sessionToken;
}

const Page = async () => {
  const loggedIn = await isUserLoggedIn();

  return (
    <SidebarAds>
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Advertisement Banner (replaces Limited Time Offers) */}
      <AdBanner />

      {/* Trending Products - Most viewed in last 7 days (shown to everyone) */}
      <div className="bg-gray-50">
        <ProductRecommendations
          type="trending"
          limit={6}
          title="Trending Now"
          layout="carousel"
        />
      </div>

      {/* Personalized sections — only for logged-in users */}
      {loggedIn && (
        <>
          {/* Personalized Recommendations - Recently viewed + user preferences */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50">
            <ProductRecommendations
              type="personalized"
              limit={6}
              title="Recommended for You"
              layout="carousel"
            />
          </div>

          {/* Recently Viewed Products */}
          <UserRecentlyViewed
            maxDisplay={6}
            displayMode="carousel"
            title="Recently Viewed"
            className="bg-white"
          />
        </>
      )}
    </SidebarAds>
  );
};

export default Page;
