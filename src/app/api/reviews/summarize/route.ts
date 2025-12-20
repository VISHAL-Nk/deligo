import { dbConnect } from "@/lib/db";
import Review from "@/models/Reviews.models";
import ReviewSummary from "@/models/ReviewSummaries.models";
import Product from "@/models/Products.models";
import { summarizeReviews, isOpenRouterConfigured } from "@/lib/openrouter";
import { NextRequest } from "next/server";

interface ReviewDocument {
  _id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface ReviewSummaryDocument {
  productId: string;
  summary: string;
  pros: string[];
  cons: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyTopics: string[];
  averageRating: number;
  totalReviews: number;
  reviewCount: number;
  lastReviewDate: Date;
  updatedAt: Date;
  needsUpdate: (currentReviewCount: number, latestReviewDate: Date) => boolean;
}

// GET - Fetch or generate review summary for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400 }
      );
    }

    await dbConnect();

    // Get all reviews for this product
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean() as unknown as ReviewDocument[];

    // Check if we have enough reviews for summarization
    if (reviews.length < 5) {
      return new Response(
        JSON.stringify({
          error: "Not enough reviews",
          message: "At least 5 reviews are required for AI summarization",
          currentCount: reviews.length,
          requiredCount: 5,
        }),
        { status: 400 }
      );
    }

    // Check if OpenRouter API is configured
    if (!isOpenRouterConfigured()) {
      return new Response(
        JSON.stringify({
          error: "AI service not configured",
          message: "Review summarization is not available at this time",
        }),
        { status: 503 }
      );
    }

    // Get latest review date
    const latestReviewDate = new Date(reviews[0].createdAt);

    // Check if we have a cached summary
    const existingSummary = await ReviewSummary.findOne({ productId }) as ReviewSummaryDocument | null;

    if (existingSummary) {
      // Check if summary needs to be updated
      const needsUpdate = existingSummary.needsUpdate(reviews.length, latestReviewDate);

      if (!needsUpdate) {
        // Return cached summary - convert to plain object
        const summaryObj = JSON.parse(JSON.stringify(existingSummary));
        return new Response(
          JSON.stringify({
            ...summaryObj,
            cached: true,
          }),
          { status: 200 }
        );
      }
    }

    // Get product name for better context
    const product = await Product.findById(productId).select('name').lean() as { name?: string } | null;
    const productName = product?.name;

    // Generate new summary using AI
    const reviewsForSummary = reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment || '',
      createdAt: new Date(r.createdAt).toISOString(),
    }));

    const summaryResult = await summarizeReviews(reviewsForSummary, productName);

    // Save or update the summary in database
    const summaryData = {
      productId,
      summary: summaryResult.summary,
      pros: summaryResult.pros,
      cons: summaryResult.cons,
      sentiment: summaryResult.sentiment,
      keyTopics: summaryResult.keyTopics,
      averageRating: summaryResult.averageRating,
      totalReviews: summaryResult.totalReviews,
      reviewCount: reviews.length,
      lastReviewDate: latestReviewDate,
    };

    const savedSummary = await ReviewSummary.findOneAndUpdate(
      { productId },
      summaryData,
      { upsert: true, new: true }
    );

    return new Response(
      JSON.stringify({
        ...savedSummary.toJSON(),
        cached: false,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Review summarization error:', error);
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500 }
    );
  }
}

// POST - Force regenerate summary (useful when reviews are updated/deleted)
export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400 }
      );
    }

    await dbConnect();

    // Delete existing summary to force regeneration
    await ReviewSummary.deleteOne({ productId });

    // Redirect to GET to generate new summary
    const url = new URL(request.url);
    url.searchParams.set('productId', productId);

    // Call GET with the same productId
    return GET(new NextRequest(url));
  } catch (error) {
    console.error('Review summary regeneration error:', error);
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500 }
    );
  }
}

// DELETE - Remove cached summary (useful for admin cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await ReviewSummary.deleteOne({ productId });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ message: "No summary found for this product" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Summary deleted successfully" }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Review summary deletion error:', error);
    let message = "Internal Server Error";
    if (error instanceof Error) message = error.message;
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500 }
    );
  }
}
