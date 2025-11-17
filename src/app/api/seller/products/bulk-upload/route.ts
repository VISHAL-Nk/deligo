import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import InventoryLog from '@/models/InventoryLogs.models';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { parseCSV, parseExcel } from '@/lib/csv-excel-utils';

// POST - Bulk upload products via CSV/Excel
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

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let productsData: Record<string, unknown>[] = [];

    // Parse based on file type
    if (file.name.endsWith('.csv')) {
      productsData = await parseCSV(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      productsData = await parseExcel(file);
    } else {
      return NextResponse.json({ error: 'Invalid file format. Use CSV or Excel' }, { status: 400 });
    }

    if (productsData.length === 0) {
      return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each product
    for (let i = 0; i < productsData.length; i++) {
      const row = productsData[i];
      
      try {
        // Validate required fields
        if (!row.sku || !row.name || !row.categoryId || !row.price) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku: row.sku });
        if (existingProduct) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: SKU ${row.sku} already exists`);
          continue;
        }

        const productData = {
          sellerId: sellerProfile._id,
          sku: row.sku as string,
          name: row.name as string,
          description: (row.description as string) || '',
          categoryId: row.categoryId as string,
          price: parseFloat(row.price as string),
          discount: row.discount ? parseFloat(row.discount as string) : 0,
          stock: row.stock ? parseInt(row.stock as string) : 0,
          lowStockThreshold: row.lowStockThreshold ? parseInt(row.lowStockThreshold as string) : 10,
          currency: (row.currency as string) || 'INR',
          status: (row.status as string) || 'draft',
          attributes: row.attributes ? JSON.parse(row.attributes as string) : {},
        };

        const product = await Product.create(productData);

        // Log inventory
        await InventoryLog.create({
          productId: product._id,
          operatorId: user._id,
          quantityChanged: product.stock,
          reason: 'Bulk upload',
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error bulk uploading products:', error);
    return NextResponse.json(
      { error: 'Failed to bulk upload products' },
      { status: 500 }
    );
  }
}
