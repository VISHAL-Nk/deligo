import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Product from "@/models/Products.models";

export async function PUT(request: Request, { params }: { params: Promise<{ productId: string, reviewId: string }> }) {
    const { productId, reviewId } = await params;
    try{
        const session = await Session();
        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }

        await dbConnect();

        const body = await request.json();
        const { rating, comment } = body;

        if (!rating || !comment) {
            return new Response(JSON.stringify({ error: "Rating and comment are required." }), {
                status: 400,
            });
        }

        // Find the product by ID
        const product = await Product.findById(productId);
        if (!product) {
            return new Response(JSON.stringify({ error: "Product not found." }), {
                status: 404,
            });
        }

        // Find the review by ID
        const review = product.reviews.id(reviewId);
        if (!review) {
            return new Response(JSON.stringify({ error: "Review not found." }), {
                status: 404,
            });
        }

        // Update the review fields
        review.rating = rating;
        review.comment = comment;
        review.updatedAt = new Date();

        // Save the updated product document
        await product.save();

        return new Response(JSON.stringify({ message: "Review updated successfully.", review }), {
            status: 200,
        });

    }
    catch (error){
        let errorMessage = "Internal Server Error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
        });
    }
    
}