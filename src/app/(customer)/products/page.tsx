import React, { Suspense } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { dbConnect } from '@/lib/db';
import Category from '@/models/ProductCategories.models';
import Product from '@/models/Products.models';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products - Browse All Categories | Deligo',
  description: 'Browse products across all categories - electronics, fashion, books, home & kitchen, and more. Great deals and fast delivery.',
  openGraph: {
    title: 'Products - Browse All Categories',
    description: 'Browse products across all categories with great deals and fast delivery',
  }
};

interface ProductType {
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

interface CategoryType {
  _id: unknown;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CategoryWithProducts {
  _id: string;
  name: string;
  description: string;
  slug: string;
  image: string;
  status: string;
  products: ProductType[];
}

// Skeleton for loading state
const ProductsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
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

async function ProductsContent({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await dbConnect();

  const params = await searchParams;
  const categoryQuery = params.category;

  if (categoryQuery) {
    // Show single category with its products
    const categoryDoc = await Category.findOne({ 
      slug: categoryQuery.toLowerCase(), 
      status: 'active' 
    }).lean() as CategoryType | null;

    if (!categoryDoc) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Category Not Found</h2>
          <p className="text-gray-600 mb-4">The category you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/products" className="text-green-600 hover:text-green-700 font-semibold">
            View All Categories
          </Link>
        </div>
      );
    }

    const productsData = await Product.find({ 
      categoryId: categoryDoc._id, 
      status: 'active' 
    }).lean();

    const products = JSON.parse(JSON.stringify(productsData)) as ProductType[];

    return (
      <div>
        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/products" className="hover:text-green-600">Products</Link>
            <ChevronRight size={16} />
            <span className="text-gray-800 font-medium">{categoryDoc.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{categoryDoc.name}</h1>
          {categoryDoc.description && (
            <p className="text-gray-600">{categoryDoc.description}</p>
          )}
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={String(product._id)} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600">No products found in this category.</p>
          </div>
        )}
      </div>
    );
  }

  // Show all categories with their products
  const categoriesDocs = await Category.find({ status: 'active' }).lean();

  if (categoriesDocs.length === 0) {
    // If no categories exist, show all products without categorization
    const allProducts = await Product.find({ status: 'active' }).lean();
    
    if (allProducts.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Available</h2>
          <p className="text-gray-600">Please check back later.</p>
        </div>
      );
    }

    const products = JSON.parse(JSON.stringify(allProducts)) as ProductType[];

    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">All Products</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={String(product._id)} product={product} />
          ))}
        </div>
      </div>
    );
  }

  // Fetch products for each category
  const categoriesWithProductsData = await Promise.all(
    categoriesDocs.map(async (categoryDoc) => {
      const productsData = await Product.find({ 
        categoryId: categoryDoc._id, 
        status: 'active' 
      }).limit(10).lean();
      
      return {
        _id: String(categoryDoc._id),
        name: String((categoryDoc as { name?: string }).name || ''),
        description: String((categoryDoc as { description?: string }).description || ''),
        slug: String((categoryDoc as { slug?: string }).slug || ''),
        image: String((categoryDoc as { image?: string }).image || ''),
        status: String((categoryDoc as { status?: string }).status || 'active'),
        products: JSON.parse(JSON.stringify(productsData)) as ProductType[]
      };
    })
  );

  // Filter out categories with no products
  const activeCategories = categoriesWithProductsData.filter(cat => cat.products.length > 0);

  // If no categories have products, show all products without categorization
  if (activeCategories.length === 0) {
    const allProducts = await Product.find({ status: 'active' }).lean();
    
    if (allProducts.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Available</h2>
          <p className="text-gray-600">Please check back later.</p>
        </div>
      );
    }

    const products = JSON.parse(JSON.stringify(allProducts)) as ProductType[];

    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">All Products</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={String(product._id)} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {activeCategories.map((category) => (
        <div key={category._id}>
          {/* Category Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
              {category.description && (
                <p className="text-gray-600 text-sm mt-1">{category.description}</p>
              )}
            </div>
            <Link
              href={`/products?category=${category.slug}`}
              className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 text-sm"
            >
              View All
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {category.products.map((product) => (
              <ProductCard key={String(product._id)} product={product} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
