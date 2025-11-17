import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Product from '@/models/Products.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import InventoryLog from '@/models/InventoryLogs.models';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadProductImage, deleteMultipleCloudinaryImages } from '@/lib/cloudinary';

// GET - Get single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const product = await Product.findOne({
      _id: id,
      sellerId: sellerProfile._id,
    }).populate('categoryId', 'name');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const product = await Product.findOne({
      _id: id,
      sellerId: sellerProfile._id,
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const oldStock = product.stock;

    // Update basic fields
    const updateFields: Record<string, unknown> = {};
    if (formData.get('name')) updateFields.name = formData.get('name');
    if (formData.get('description')) updateFields.description = formData.get('description');
    if (formData.get('price')) updateFields.price = parseFloat(formData.get('price') as string);
    if (formData.get('discount')) updateFields.discount = parseFloat(formData.get('discount') as string);
    if (formData.get('stock')) updateFields.stock = parseInt(formData.get('stock') as string);
    if (formData.get('lowStockThreshold')) updateFields.lowStockThreshold = parseInt(formData.get('lowStockThreshold') as string);
    if (formData.get('status')) updateFields.status = formData.get('status');
    if (formData.get('variants')) updateFields.variants = JSON.parse(formData.get('variants') as string);
    if (formData.get('seo')) updateFields.seo = JSON.parse(formData.get('seo') as string);
    if (formData.get('attributes')) updateFields.attributes = JSON.parse(formData.get('attributes') as string);

    // Handle new image uploads
    const newImageFiles = formData.getAll('newImages') as File[];
    if (newImageFiles.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const imageUrl = await uploadProductImage(
            buffer,
            sellerProfile._id.toString(),
            product._id.toString(),
            `image-${Date.now()}-${i}.jpg`
          );
          newImages.push(imageUrl);
        }
      }
      updateFields.images = [...product.images, ...newImages];
    }

    // Handle image deletions
    const deleteImages = formData.get('deleteImages');
    if (deleteImages) {
      const imagesToDelete = JSON.parse(deleteImages as string) as string[];
      await deleteMultipleCloudinaryImages(imagesToDelete);
      updateFields.images = product.images.filter((img: string) => !imagesToDelete.includes(img));
    }

    // Update product
    Object.assign(product, updateFields);
    await product.save();

    // Log inventory changes
    if (updateFields.stock !== undefined && oldStock !== updateFields.stock) {
      await InventoryLog.create({
        productId: product._id,
        operatorId: user._id,
        quantityChanged: (updateFields.stock as number) - oldStock,
        reason: 'Manual update',
      });
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// PATCH - Update product (alternative to PUT)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const product = await Product.findOne({
      _id: id,
      sellerId: sellerProfile._id,
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const oldStock = product.stock;

    // Update basic fields
    const updateFields: Record<string, unknown> = {};
    if (formData.get('name')) updateFields.name = formData.get('name');
    if (formData.get('description')) updateFields.description = formData.get('description');
    if (formData.get('categoryId')) updateFields.categoryId = formData.get('categoryId');
    if (formData.get('sku')) updateFields.sku = formData.get('sku');
    if (formData.get('price')) updateFields.price = parseFloat(formData.get('price') as string);
    if (formData.get('discount')) updateFields.discount = parseFloat(formData.get('discount') as string);
    if (formData.get('stock')) updateFields.stock = parseInt(formData.get('stock') as string);
    if (formData.get('lowStockThreshold')) updateFields.lowStockThreshold = parseInt(formData.get('lowStockThreshold') as string);
    if (formData.get('status')) updateFields.status = formData.get('status');
    if (formData.get('seo')) updateFields.seo = JSON.parse(formData.get('seo') as string);

    // Handle existing images
    const existingImagesStr = formData.get('existingImages');
    let existingImages: string[] = [];
    if (existingImagesStr) {
      existingImages = JSON.parse(existingImagesStr as string);
    }

    // Handle new image uploads
    const newImageFiles = formData.getAll('newImages') as File[];
    const uploadedImages: string[] = [];
    
    if (newImageFiles.length > 0) {
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i];
        if (file && file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const imageUrl = await uploadProductImage(
            buffer,
            sellerProfile._id.toString(),
            product._id.toString(),
            `image-${Date.now()}-${i}.jpg`
          );
          uploadedImages.push(imageUrl);
        }
      }
    }

    // Combine existing and new images
    updateFields.images = [...existingImages, ...uploadedImages];

    // Delete removed images from Cloudinary
    const removedImages = product.images.filter((img: string) => !existingImages.includes(img));
    if (removedImages.length > 0) {
      await deleteMultipleCloudinaryImages(removedImages);
    }

    // Update product
    Object.assign(product, updateFields);
    await product.save();

    // Log inventory changes
    if (updateFields.stock !== undefined && oldStock !== updateFields.stock) {
      await InventoryLog.create({
        productId: product._id,
        operatorId: user._id,
        quantityChanged: (updateFields.stock as number) - oldStock,
        reason: 'Manual update',
      });
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete single product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const product = await Product.findOne({
      _id: id,
      sellerId: sellerProfile._id,
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete
    product.status = 'deleted';
    await product.save();

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
