import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import InventoryLog from '@/models/InventoryLogs.models';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - Get inventory status
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'low-stock') {
      // Get low stock products
      const lowStockProducts = await Product.find({
        sellerId: sellerProfile._id,
        status: 'active',
        $expr: { $lte: ['$stock', '$lowStockThreshold'] }
      }).select('name sku stock lowStockThreshold');

      return NextResponse.json({
        success: true,
        data: lowStockProducts,
      });
    }

    if (type === 'logs') {
      // Get inventory logs
      const productId = searchParams.get('productId');
      const query: Record<string, unknown> = {};
      
      if (productId) {
        query.productId = productId;
      } else {
        // Get all products for seller
        const products = await Product.find({ sellerId: sellerProfile._id }).select('_id');
        query.productId = { $in: products.map(p => p._id) };
      }

      const logs = await InventoryLog.find(query)
        .populate('productId', 'name sku')
        .populate('operatorId', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);

      return NextResponse.json({
        success: true,
        data: logs,
      });
    }

    // Get inventory summary
    const [totalProducts, lowStockCount, outOfStockCount] = await Promise.all([
      Product.countDocuments({ sellerId: sellerProfile._id, status: 'active' }),
      Product.countDocuments({
        sellerId: sellerProfile._id,
        status: 'active',
        $expr: { $lte: ['$stock', '$lowStockThreshold'] }
      }),
      Product.countDocuments({
        sellerId: sellerProfile._id,
        status: 'active',
        stock: 0,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Bulk update inventory
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

    const { updates } = await req.json();
    // updates format: [{ productId, newStock, reason }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid updates data' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      try {
        const product = await Product.findOne({
          _id: update.productId,
          sellerId: sellerProfile._id,
        });

        if (!product) {
          results.failed++;
          results.errors.push(`Product ${update.productId} not found`);
          continue;
        }

        const oldStock = product.stock;
        product.stock = update.newStock;
        await product.save();

        // Log the change
        await InventoryLog.create({
          productId: product._id,
          operatorId: user._id,
          quantityChanged: update.newStock - oldStock,
          reason: update.reason || 'Bulk inventory update',
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Product ${update.productId}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
