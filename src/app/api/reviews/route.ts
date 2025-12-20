import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Review from "@/models/Reviews.models";
import UserProfile from "@/models/UserProfiles.models";

// GET - Fetch reviews for a product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID required" }), { status: 400 });
    }

    await dbConnect();

    const reviews = await Review.find({ productId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user profiles for all reviewers to get their names
    const userIds = reviews.map((r: { userId?: { _id?: string } }) => r.userId?._id).filter(Boolean);
    const userProfiles = await UserProfile.find({ userId: { $in: userIds } })
      .select('userId fullName')
      .lean();

    // Create a map of userId to fullName
    const profileMap = new Map(
      userProfiles.map((p: { userId: { toString: () => string }; fullName?: string }) => [p.userId.toString(), p.fullName])
    );

    // Add name to each review
    const reviewsWithNames = reviews.map((review: { userId?: { _id?: { toString: () => string }; email?: string }; rating: number; comment?: string; images?: string[]; createdAt: Date; _id: string }) => ({
      ...review,
      userId: {
        ...review.userId,
        name: review.userId?._id ? profileMap.get(review.userId._id.toString()) || 'Anonymous' : 'Anonymous',
      },
    }));

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? (reviews as unknown as { rating: number }[]).reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return new Response(JSON.stringify({ 
      reviews: reviewsWithNames, 
      avgRating: avgRating.toFixed(1),
      totalReviews: reviews.length 
    }), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// POST - Add a review
export async function POST(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { productId, rating, comment, images } = await request.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid product or rating" }), { status: 400 });
    }

    await dbConnect();

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ 
      userId: session.user.id, 
      productId 
    });

    if (existingReview) {
      return new Response(JSON.stringify({ error: "You have already reviewed this product" }), { status: 400 });
    }

    const review = new Review({
      userId: session.user.id,
      productId,
      rating,
      comment: comment || '',
      images: images || []
    });

    await review.save();

    return new Response(JSON.stringify({ message: "Review added successfully", review }), { status: 201 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// PUT - Update a review
export async function PUT(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { reviewId, rating, comment, images } = await request.json();

    if (!reviewId || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid review or rating" }), { status: 400 });
    }

    await dbConnect();

    const review = await Review.findOne({ _id: reviewId, userId: session.user.id });

    if (!review) {
      return new Response(JSON.stringify({ error: "Review not found or unauthorized" }), { status: 404 });
    }

    review.rating = rating;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();

    return new Response(JSON.stringify({ message: "Review updated successfully", review }), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// DELETE - Delete a review
export async function DELETE(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { reviewId } = await request.json();

    if (!reviewId) {
      return new Response(JSON.stringify({ error: "Review ID required" }), { status: 400 });
    }

    await dbConnect();

    const review = await Review.findOneAndDelete({ _id: reviewId, userId: session.user.id });

    if (!review) {
      return new Response(JSON.stringify({ error: "Review not found or unauthorized" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Review deleted successfully" }), { status: 200 });
  } catch (error) {
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
