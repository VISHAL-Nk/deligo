import { Session } from "@/lib/Session";

export async function PUT(request: Request, { params }: { params: { productId: string ,reviewId:string} }) {
    const { productId, reviewId } = params;
    try{
        const session = await Session();
        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }
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