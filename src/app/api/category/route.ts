import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Category from "@/models/ProductCategories.models";
import Product from "@/models/Products.models";

export  async function GET(request: Request){
    try{
        const session = Session();
        if(!session){
            return new Response("Unauthorized", {status: 401});
        }

        await dbConnect();
        const searchParams = new URL(request.url).searchParams;
        const category = searchParams.get("category");
        if(!category){
            return new Response("Category is required", {status: 400});
        }
        
        const categories = await Category.find({name: {$regex: category, $options: "i"}, status: "active"}).lean();

        const product = await Product.find({categoryId: {$in: categories.map(cat => cat._id)}, status: "active"}).lean();

        if(!product || product.length === 0){
            return new Response("No products found", {status: 404});
        }

        return new Response(JSON.stringify(product), {status: 200});
    }
    catch(error){
        let message = "Internal Server Error";
        if(error instanceof Error){
            message = error.message;
        }
        return new Response(message, {status: 500});
    }
}