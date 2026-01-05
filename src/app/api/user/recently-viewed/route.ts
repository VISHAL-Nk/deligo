import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/db';
import UserProfile from '@/models/UserProfiles.models';
import Product from '@/models/Products.models';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get user profile with recently viewed
    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!userProfile || !userProfile.preferences?.recentlyViewed) {
      return NextResponse.json({
        success: true,
        recentlyViewed: []
      });
    }

    // Get the product IDs from recently viewed (they're already sorted by most recent)
    const productIds = userProfile.preferences.recentlyViewed
      .map((item: { productId: string; viewedAt: Date }) => item.productId)
      .filter((id: string) => id);

    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        recentlyViewed: []
      });
    }

    // Fetch product details
    const products = await Product.find({ 
      _id: { $in: productIds } 
    }).lean();

    // Create a map for quick lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productMap = new Map<string, any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products.forEach((product: any) => {
      productMap.set(product._id.toString(), product);
    });

    // Build response maintaining the order from recently viewed
    const recentlyViewed = userProfile.preferences.recentlyViewed
      .map((item: { productId: string; viewedAt: Date }) => {
        const product = productMap.get(item.productId.toString());
        if (!product) return null;
        
        return {
          _id: product._id,
          name: product.name,
          price: product.price,
          discount: product.discount || 0,
          images: product.images || [],
          viewedAt: item.viewedAt,
          category: product.category,
          seller: product.seller
        };
      })
      .filter((item: unknown) => item !== null);

    return NextResponse.json({
      success: true,
      recentlyViewed
    });

  } catch (error) {
    console.error('Error fetching recently viewed products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recently viewed products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Update user profile with recently viewed product
    const userProfile = await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      {},
      { upsert: true, new: true }
    );

    // Initialize preferences if they don't exist
    if (!userProfile.preferences) {
      userProfile.preferences = {};
    }
    if (!userProfile.preferences.recentlyViewed) {
      userProfile.preferences.recentlyViewed = [];
    }

    // Remove existing entry for this product if it exists
    userProfile.preferences.recentlyViewed = userProfile.preferences.recentlyViewed.filter(
      (item: { productId: string; viewedAt: Date }) => item.productId.toString() !== productId
    );

    // Add new entry at the beginning
    userProfile.preferences.recentlyViewed.unshift({
      productId: productId,
      viewedAt: new Date()
    });

    // Keep only the last 20 items
    userProfile.preferences.recentlyViewed = userProfile.preferences.recentlyViewed.slice(0, 20);

    // Save the updated profile
    await userProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Product added to recently viewed'
    });

  } catch (error) {
    console.error('Error adding to recently viewed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add product to recently viewed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Clear recently viewed for user
    await UserProfile.findOneAndUpdate(
      { userId: session.user.id },
      { 
        $set: { 
          'preferences.recentlyViewed': [] 
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Recently viewed cleared'
    });

  } catch (error) {
    console.error('Error clearing recently viewed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear recently viewed' },
      { status: 500 }
    );
  }
}