import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Category from '@/models/ProductCategories.models';
import User from '@/models/User.models';
import { authOptions } from '../../../auth/[...nextauth]/route';

const defaultCategories = [
  {
    name: 'Electronics',
    filters: ['brand', 'warranty', 'color'],
  },
  {
    name: 'Fashion',
    filters: ['size', 'color', 'brand', 'material'],
  },
  {
    name: 'Home & Kitchen',
    filters: ['brand', 'material', 'color', 'capacity'],
  },
  {
    name: 'Books',
    filters: ['author', 'publisher', 'language', 'format'],
  },
  {
    name: 'Sports & Fitness',
    filters: ['brand', 'size', 'color', 'weight'],
  },
  {
    name: 'Beauty & Personal Care',
    filters: ['brand', 'skin-type', 'fragrance', 'volume'],
  },
  {
    name: 'Toys & Games',
    filters: ['age-group', 'brand', 'material', 'color'],
  },
  {
    name: 'Grocery & Gourmet',
    filters: ['brand', 'weight', 'expiry-date', 'organic'],
  },
  {
    name: 'Automotive',
    filters: ['brand', 'compatible-vehicles', 'material', 'warranty'],
  },
  {
    name: 'Pet Supplies',
    filters: ['pet-type', 'brand', 'size', 'flavor'],
  },
];

// POST - Seed default categories
export async function POST() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: `Database already has ${existingCount} category(ies). Delete existing categories first or add them manually.`,
          existingCount 
        },
        { status: 409 }
      );
    }

    // Insert default categories
    const createdCategories = await Category.insertMany(defaultCategories);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCategories.length} default categories`,
      data: {
        count: createdCategories.length,
        categories: createdCategories,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed categories' },
      { status: 500 }
    );
  }
}
