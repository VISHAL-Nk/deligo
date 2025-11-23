import { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';

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
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

async function getProduct(id: string): Promise<ProductType | null> {
  try {
    await dbConnect();
    const product = await Product.findById(id).lean();
    
    if (!product) return null;
    
    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | Deligo',
      description: 'The product you are looking for could not be found.',
    };
  }

  const finalPrice = product.price - product.discount;
  const title = product.seo?.metaTitle || `${product.name} | Deligo`;
  const description = product.seo?.metaDescription || 
    product.description?.substring(0, 160) || 
    `Buy ${product.name} at ₹${finalPrice}. Fast delivery and great deals on Deligo.`;

  return {
    title,
    description,
    keywords: product.seo?.tags || [],
    openGraph: {
      title,
      description,
      images: product.images.length > 0 ? [product.images[0]] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return <ProductDetailClient productId={id} />;
}
