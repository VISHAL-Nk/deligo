import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Review from "@/models/Reviews.models";
import { getServerSession } from "next-auth";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } },
) {
  const { productId } = params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    await dbConnect();
    
    const reviews = await Review.find({ product: productId });
    if(!reviews){
      return new Response(JSON.stringify({ error: "No reviews found" }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify(reviews), { status: 200 });
  } catch (error) {}
}

export async function POST(
  request: Request,
  { params }: { params: { productId: string } },
) {
  const { productId } = params;
  try {
    const session = await getServerSession(authOptions);
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
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}