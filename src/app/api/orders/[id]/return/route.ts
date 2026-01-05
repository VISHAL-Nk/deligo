import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/db';
import Order from '@/models/Orders.models';

// POST - Request a return for an order
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;
    const { reason } = await request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid reason for the return (at least 10 characters)' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the order and verify it belongs to the user
    const order = await Order.findOne({ 
      _id: orderId, 
      userId: session.user.id 
    }).populate({
      path: 'items.productId',
      select: 'name returnPolicy'
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { success: false, message: 'Only delivered orders can be returned' },
        { status: 400 }
      );
    }

    // Check if return was already requested
    if (order.returnRequest?.status) {
      return NextResponse.json(
        { success: false, message: `Return already ${order.returnRequest.status}` },
        { status: 400 }
      );
    }

    // Check return window for each product
    const deliveredDate = new Date(order.updatedAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));

    // Find the minimum return window among all products
    let minReturnDays = Infinity;
    let returnEnabled = true;

    for (const item of order.items) {
      const product = item.productId as { returnPolicy?: { enabled: boolean; days: number; type: string } };
      if (product?.returnPolicy) {
        if (!product.returnPolicy.enabled || product.returnPolicy.type === 'no-return') {
          returnEnabled = false;
          break;
        }
        minReturnDays = Math.min(minReturnDays, product.returnPolicy.days || 7);
      } else {
        // Default return window of 7 days if not specified
        minReturnDays = Math.min(minReturnDays, 7);
      }
    }

    if (!returnEnabled) {
      return NextResponse.json(
        { success: false, message: 'One or more items in this order are not eligible for return' },
        { status: 400 }
      );
    }

    if (daysSinceDelivery > minReturnDays) {
      return NextResponse.json(
        { success: false, message: `Return window of ${minReturnDays} days has expired` },
        { status: 400 }
      );
    }

    // Create return request
    order.status = 'return-requested';
    order.returnRequest = {
      requestedAt: new Date(),
      reason: reason.trim(),
      status: 'pending'
    };

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Return request submitted successfully',
      order: {
        _id: order._id,
        status: order.status,
        returnRequest: order.returnRequest
      }
    });
  } catch (error) {
    console.error('Error requesting return:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process return request' },
      { status: 500 }
    );
  }
}

// GET - Get return request status
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: orderId } = await params;

    await dbConnect();

    const order = await Order.findOne({ 
      _id: orderId, 
      userId: session.user.id 
    }).select('status returnRequest updatedAt items').populate({
      path: 'items.productId',
      select: 'name returnPolicy'
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Calculate return eligibility
    const deliveredDate = new Date(order.updatedAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));

    let minReturnDays = 7;
    let returnEnabled = true;

    for (const item of order.items) {
      const product = item.productId as { returnPolicy?: { enabled: boolean; days: number; type: string } };
      if (product?.returnPolicy) {
        if (!product.returnPolicy.enabled || product.returnPolicy.type === 'no-return') {
          returnEnabled = false;
          break;
        }
        minReturnDays = Math.min(minReturnDays, product.returnPolicy.days || 7);
      }
    }

    const canReturn = order.status === 'delivered' && 
                      returnEnabled && 
                      daysSinceDelivery <= minReturnDays &&
                      !order.returnRequest?.status;

    return NextResponse.json({
      success: true,
      data: {
        status: order.status,
        returnRequest: order.returnRequest || null,
        returnEligibility: {
          eligible: canReturn,
          returnWindow: minReturnDays,
          daysRemaining: Math.max(0, minReturnDays - daysSinceDelivery),
          returnEnabled
        }
      }
    });
  } catch (error) {
    console.error('Error fetching return status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch return status' },
      { status: 500 }
    );
  }
}
