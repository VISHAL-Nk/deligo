import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Review from '@/models/Reviews.models';
import Product from '@/models/Products.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - Get all reviews for seller's products
export async function GET(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Get all product IDs for this seller
    const products = await Product.find({ sellerId: sellerProfile._id }).select('_id');
    const productIds = products.map(p => p._id);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ productId: { $in: productIds } })
        .populate('userId', 'name email')
        .populate('productId', 'name images sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId: { $in: productIds } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Reply to a review
export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const { reviewId, message } = await req.json();

    const review = await Review.findById(reviewId).populate('productId');
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify product belongs to seller
    const product = await Product.findOne({
      _id: review.productId,
      sellerId: sellerProfile._id,
    });

    if (!product) {
      return NextResponse.json({ error: 'Unauthorized to reply to this review' }, { status: 403 });
    }

    review.sellerReply = {
      message,
      createdAt: new Date(),
    };

    await review.save();

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    return NextResponse.json(
      { error: 'Failed to reply to review' },
      { status: 500 }
    );
  }
}

// PATCH - Report a review
export async function PATCH(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await SellerProfile.findOne({ userId: user._id });
    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const { reviewId, reportReason } = await req.json();

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify product belongs to seller
    const product = await Product.findOne({
      _id: review.productId,
      sellerId: sellerProfile._id,
    });

    if (!product) {
      return NextResponse.json({ error: 'Unauthorized to report this review' }, { status: 403 });
    }

    review.reported = true;
    review.reportReason = reportReason;
    await review.save();

    return NextResponse.json({
      success: true,
      message: 'Review reported successfully',
    });
  } catch (error) {
    console.error('Error reporting review:', error);
    return NextResponse.json(
      { error: 'Failed to report review' },
      { status: 500 }
    );
  }
}
