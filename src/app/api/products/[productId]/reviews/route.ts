import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Review from "@/models/Reviews.models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  try {
    // ✅ No authentication required for viewing reviews - public endpoint
    await dbConnect();
    
    const reviews = await Review.find({ product: productId })
      .populate('user', 'fullName email') // Include user info
      .lean();
      
    if(!reviews){
      return new Response(JSON.stringify({ error: "No reviews found" }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify(reviews), { status: 200 });
  } catch (error) {
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  try {
    const session = await Session();
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const { user } = session;
    const body = await request.json();
    await dbConnect();
    const newReview = new Review({
      user: user.id,
      product: productId,
      rating: body.rating,
      comment: body.comment,
    });
    await newReview.save();
    return new Response(JSON.stringify(newReview), { status: 201 });
  } catch (error) {
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}