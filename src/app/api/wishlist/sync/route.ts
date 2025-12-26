import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import Wishlist, { IWishlist } from "@/models/Wishlist.models";
import Product from "@/models/Products.models";

// POST - Sync local wishlist with server
// Merges products from localStorage with server wishlist
export async function POST(request: Request) {
  try {
    const session = await Session();

    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401 
      });
    }

    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds)) {
      return new Response(JSON.stringify({ error: "Invalid product IDs" }), { 
        status: 400 
      });
    }

    await dbConnect();

    // Get existing wishlist
    const existingWishlist = await Wishlist.findOne({ userId: session.user.id }) as IWishlist | null;
    const existingIds = new Set(
      existingWishlist?.products?.map((p) => 
        p.productId.toString()
      ) || []
    );

    // Filter out products that are already in wishlist
    const newProductIds = productIds.filter((id: string) => !existingIds.has(id));

    if (newProductIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Wishlist already synced",
          added: 0,
        }),
        { status: 200 }
      );
    }

    // Verify products exist and get their prices
    const products = await Product.find({
      _id: { $in: newProductIds },
      status: "active",
    }).select("_id price discount").lean();
    
    // Type the products properly
    const typedProducts = products as unknown as Array<{
      _id: { toString(): string };
      price: number;
      discount: number;
    }>;

    // Prepare products to add
    const productsToAdd = typedProducts.map((product) => ({
      productId: product._id,
      priceAtAdd: product.price - product.discount,
      addedAt: new Date(),
      priceAlertEnabled: false,
    }));

    if (productsToAdd.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No valid products to sync",
          added: 0,
        }),
        { status: 200 }
      );
    }

    // Add new products to wishlist
    await Wishlist.findOneAndUpdate(
      { userId: session.user.id },
      {
        $push: {
          products: { $each: productsToAdd },
        },
      },
      { upsert: true, new: true }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${productsToAdd.length} products`,
        added: productsToAdd.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/wishlist/sync error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
