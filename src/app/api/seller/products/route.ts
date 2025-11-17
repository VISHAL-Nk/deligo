import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';
import Category from '@/models/ProductCategories.models'; // Import to register model for populate
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import InventoryLog from '@/models/InventoryLogs.models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadProductImage, deleteProductFolder } from '@/lib/cloudinary';

// GET - List all products for seller
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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { sellerId: sellerProfile._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Ensure Category model is registered before populate
    if (!Category) {
      console.error('Category model not loaded');
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
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
    const productData = {
      sellerId: sellerProfile._id,
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      categoryId: formData.get('categoryId') as string,
      price: parseFloat(formData.get('price') as string),
      discount: parseFloat(formData.get('discount') as string) || 0,
      stock: parseInt(formData.get('stock') as string) || 0,
      lowStockThreshold: parseInt(formData.get('lowStockThreshold') as string) || 10,
      variants: formData.get('variants') ? JSON.parse(formData.get('variants') as string) : [],
      seo: formData.get('seo') ? JSON.parse(formData.get('seo') as string) : {},
      attributes: formData.get('attributes') ? JSON.parse(formData.get('attributes') as string) : {},
      status: formData.get('status') as string || 'draft',
    };

    // Create product first to get ID
    const product = await Product.create(productData);

    // Handle image uploads
    const images: string[] = [];
    const imageFiles = formData.getAll('images') as File[];
    
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const imageUrl = await uploadProductImage(
          buffer,
          sellerProfile._id.toString(),
          product._id.toString(),
          `image-${i}.jpg`
        );
        images.push(imageUrl);
      }
    }

    // Update product with images
    product.images = images;
    await product.save();

    // Log inventory creation
    await InventoryLog.create({
      productId: product._id,
      operatorId: user._id,
      quantityChanged: product.stock,
      reason: 'Initial stock',
    });

    return NextResponse.json({
      success: true,
      data: product,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete products
export async function DELETE(req: NextRequest) {
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

    const { productIds } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
    }

    // Verify all products belong to seller and delete images
    const products = await Product.find({
      _id: { $in: productIds },
      sellerId: sellerProfile._id,
    });

    for (const product of products) {
      // Delete product images from Cloudinary
      await deleteProductFolder(sellerProfile._id.toString(), product._id.toString());
    }

    // Soft delete products
    await Product.updateMany(
      { _id: { $in: productIds }, sellerId: sellerProfile._id },
      { status: 'deleted' }
    );

    return NextResponse.json({
      success: true,
      message: `${products.length} product(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting products:', error);
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}
