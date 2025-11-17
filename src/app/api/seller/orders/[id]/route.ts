import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Orders.models';
import Product from '@/models/Products.models';
import SellerProfile from '@/models/SellerProfiles.models';
import User from '@/models/User.models';
import Payout from '@/models/Payouts.models';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { calculateCommission } from '@/lib/analytics';

// GET - Get single order
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

    const order = await Order.findOne({
      _id: id,
      sellerId: sellerProfile._id,
    })
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name images sku price')
      .populate('paymentId')
      .populate('shipmentId');

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH - Update order status
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

    const order = await Order.findOne({
      _id: id,
      sellerId: sellerProfile._id,
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { status } = await req.json();
    const validStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    // If order is confirmed, reduce inventory
    if (status === 'confirmed' && oldStatus === 'pending') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { 
            stock: -item.quantity,
            reserved: -item.quantity,
            orderCount: 1,
          },
        });
      }
    }

    // If order is delivered, create payout entry
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const commission = calculateCommission(order.totalAmount);
      const netAmount = order.totalAmount - commission;

      await Payout.create({
        sellerId: sellerProfile._id,
        orderId: order._id,
        amount: order.totalAmount,
        platformCommission: commission,
        taxDeducted: 0,
        netAmount: netAmount,
        status: 'pending',
      });
    }

    // If order is cancelled or refunded, restore inventory
    if ((status === 'cancelled' || status === 'refunded') && !['cancelled', 'refunded'].includes(oldStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { 
            stock: item.quantity,
            orderCount: -1,
          },
        });
        
        // Increment return count if refunded
        if (status === 'refunded') {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { returnCount: 1 },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
