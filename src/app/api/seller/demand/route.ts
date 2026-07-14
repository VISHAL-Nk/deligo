import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Products.models";
import SellerProfile from "@/models/SellerProfiles.models";
import Order from "@/models/Orders.models";

const DEMAND_SERVER_URL = process.env.DEMAND_SERVER_URL || "";

/**
 * Lightweight order-count-based demand estimation when the ML server is unavailable.
 * Uses real order history from MongoDB to estimate demand per product per day.
 */
async function estimateDemandFromOrders(
  productId: string,
  days: number
): Promise<{
  history: { date: string; historical_demand: number }[];
  forecasts: { date: string; predicted_demand: number }[];
  total_predicted_demand: number;
}> {
  await dbConnect();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  // Aggregate daily order quantities for this product
  const pipeline = [
    {
      $match: {
        "items.productId": { $exists: true },
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ["cancelled", "failed"] },
      },
    },
    { $unwind: "$items" },
    {
      $match: { "items.productId": { $toString: productId } },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ];

  let dailyData: { date: string; historical_demand: number }[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (Order as any).aggregate(pipeline);
    dailyData = results.map((r: { _id: string; quantity: number }) => ({
      date: r._id,
      historical_demand: r.quantity,
    }));
  } catch {
    // If aggregation fails, return empty
  }

  // Simple moving average forecast: use last 7-day average
  const recent = dailyData.slice(-7);
  const avgDaily =
    recent.length > 0
      ? recent.reduce((s, d) => s + d.historical_demand, 0) / recent.length
      : 0;

  const forecasts: { date: string; predicted_demand: number }[] = [];
  const lastDate =
    dailyData.length > 0
      ? new Date(dailyData[dailyData.length - 1].date)
      : new Date();

  for (let i = 1; i <= days; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    // Add slight weekend effect variation
    const dow = d.getDay();
    const factor = dow === 0 || dow === 6 ? 1.15 : 1.0;
    forecasts.push({
      date: d.toISOString().split("T")[0],
      predicted_demand: Math.max(0, Math.round(avgDaily * factor * 10) / 10),
    });
  }

  return {
    history: dailyData.slice(-90),
    forecasts,
    total_predicted_demand: forecasts.reduce(
      (s, f) => s + f.predicted_demand,
      0
    ),
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "seller" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    await dbConnect();

    // Get seller profile for authorization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sellerProfile: any = null;
    if (session.user.role === "seller") {
      sellerProfile = await SellerProfile.findOne({ userId: session.user.id });
      if (!sellerProfile) {
        return NextResponse.json(
          { error: "Seller profile not found" },
          { status: 404 }
        );
      }
    }

    if (action === "forecast") {
      const productId = searchParams.get("productId");
      const days = parseInt(searchParams.get("days") || "7");

      if (!productId) {
        return NextResponse.json(
          { error: "Product ID is required" },
          { status: 400 }
        );
      }

      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      if (session.user.role !== "admin" && sellerProfile) {
        if (
          product.sellerId.toString() !== sellerProfile._id.toString()
        ) {
          return NextResponse.json(
            { error: "Unauthorized to view this product" },
            { status: 403 }
          );
        }
      }

      // Try the ML demand server first
      if (DEMAND_SERVER_URL) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(
            `${DEMAND_SERVER_URL}/api/forecast/${productId}?days=${days}`,
            { signal: controller.signal }
          );
          clearTimeout(timer);
          if (response.ok) {
            const data = await response.json();
            return NextResponse.json(data);
          }
        } catch {
          // Fall through to DB-based estimation
        }
      }

      // Fallback: estimate demand from order history
      const estimated = await estimateDemandFromOrders(productId, days);
      return NextResponse.json({
        product_id: productId,
        forecast_days: days,
        source: "order_history_estimate",
        ...estimated,
      });
    } else if (action === "alerts") {
      const days = parseInt(searchParams.get("days") || "7");

      // Try ML server first
      if (DEMAND_SERVER_URL) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const url =
            session.user.role === "seller" && sellerProfile
              ? `${DEMAND_SERVER_URL}/api/stock-alerts?days=${days}&seller_id=${sellerProfile._id.toString()}`
              : `${DEMAND_SERVER_URL}/api/stock-alerts?days=${days}`;
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);
          if (response.ok) {
            return NextResponse.json(await response.json());
          }
        } catch {
          // Fall through to DB-based alerts
        }
      }

      // Fallback: query products with low stock vs recent order rate
      const sellerQuery =
        session.user.role === "seller" && sellerProfile
          ? { sellerId: sellerProfile._id }
          : {};
      const products = await Product.find(sellerQuery)
        .select("_id name stock")
        .limit(20)
        .lean();

      const alerts = [];
      for (const p of products) {
        const { total_predicted_demand } = await estimateDemandFromOrders(
          p._id.toString(),
          days
        );
        if (total_predicted_demand > (p.stock || 0)) {
          alerts.push({
            product_id: p._id.toString(),
            name: p.name,
            current_stock: p.stock || 0,
            predicted_demand_7d: Math.round(total_predicted_demand),
            shortfall: Math.round(total_predicted_demand - (p.stock || 0)),
            source: "order_history_estimate",
          });
        }
      }

      return NextResponse.json({
        alerts: alerts.sort((a, b) => b.shortfall - a.shortfall),
        source: "order_history_estimate",
      });
    } else if (action === "all-forecasts") {
      const days = parseInt(searchParams.get("days") || "14");
      const limit = Math.min(
        parseInt(searchParams.get("limit") || "20"),
        20
      );

      const sellerProducts = await Product.find({
        sellerId: sellerProfile?._id,
      })
        .sort({ orderCount: -1 })
        .limit(limit)
        .select("_id name stock price orderCount")
        .lean();

      // Try ML server first for all products
      if (DEMAND_SERVER_URL) {
        try {
          const forecastPromises = sellerProducts.map(async (product) => {
            try {
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 10000);
              const response = await fetch(
                `${DEMAND_SERVER_URL}/api/forecast/${product._id}?days=${days}`,
                { signal: controller.signal }
              );
              clearTimeout(timer);
              if (response.ok) {
                const data = await response.json();
                return {
                  product_id: product._id.toString(),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name: (product as any).name,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  current_stock: (product as any).stock || 0,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  price: (product as any).price || 0,
                  history: data.history || [],
                  forecasts: data.forecasts || [],
                  total_predicted_demand: data.total_predicted_demand || 0,
                  source: "ml_engine",
                };
              }
            } catch {
              return null;
            }
            return null;
          });

          const mlResults = await Promise.all(forecastPromises);
          const validMlResults = mlResults.filter((r) => r !== null);

          if (validMlResults.length > 0) {
            return NextResponse.json({
              success: true,
              data: validMlResults,
              source: "ml_engine",
            });
          }
        } catch {
          // Fall through to DB estimation
        }
      }

      // Fallback: estimate from order history for all products
      const forecastPromises = sellerProducts.map(async (product) => {
        const estimated = await estimateDemandFromOrders(
          product._id.toString(),
          days
        );
        return {
          product_id: product._id.toString(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name: (product as any).name,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current_stock: (product as any).stock || 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          price: (product as any).price || 0,
          ...estimated,
          source: "order_history_estimate",
        };
      });

      const results = await Promise.all(forecastPromises);
      return NextResponse.json({
        success: true,
        data: results,
        source: "order_history_estimate",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Demand API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
