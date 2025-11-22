import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import crypto from "crypto";
import Cart from "@/models/Cart.models";
import Product from "@/models/Products.models";
import Order from "@/models/Orders.models";
import Shipment from "@/models/Shipments.models";
import Notification from "@/models/Notifications.models";
import User from "@/models/User.models";
import Payment from "@/models/Payments.models";
import { generateOTP, generateTrackingNumber } from "@/lib/delivery-utils";
import { sendOrderConfirmationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      shippingAddress,
      items: directItems
    } = await req.json();

    // Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode) {
      return NextResponse.json(
        { error: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    let cartItems;

    // Check if this is a direct purchase (items provided) or cart checkout
    if (directItems && directItems.length > 0) {
      // Direct purchase - get products from the provided items
      const productIds = directItems.map((item: any) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).populate('sellerId');
      
      cartItems = {
        items: directItems.map((item: any) => {
          const product = products.find((p: any) => p._id.toString() === item.productId);
          return {
            productId: product,
            quantity: item.quantity
          };
        })
      };
    } else {
      // Get user's cart
      cartItems = await Cart.findOne({ userId: session.user.id }).populate('items.productId');
      if (!cartItems || cartItems.items.length === 0) {
        return NextResponse.json(
          { error: "Cart is empty" },
          { status: 400 }
        );
      }
    }

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Group items by seller
    const sellerGroups = new Map();
    let totalCartAmount = 0;

    for (const item of cartItems.items) {
      const product = item.productId;
      
      // Check stock availability
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      const sellerId = product.sellerId.toString();
      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, []);
      }
      sellerGroups.get(sellerId).push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        discount: product.discount,
        name: product.name,
        product: product
      });

      const itemPrice = product.price - (product.price * product.discount / 100);
      totalCartAmount += itemPrice * item.quantity;
    }

    // Create initial payment record without orderId (will be updated with orders)
    const payment = await Payment.create({
      userId: session.user.id,
      amount: totalCartAmount + (totalCartAmount * 0.05) + 40, // Add tax and shipping
      currency: "INR",
      status: "completed",
      paymentMethod: "razorpay",
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      // orderId will be set to the first order, or can remain null for multi-order payments
    });

    const createdOrders = [];
    let firstOrderId = null;

    // Create separate orders for each seller
    for (const [sellerId, items] of sellerGroups) {
      interface CartItem {
        productId: string;
        quantity: number;
        price: number;
        discount: number;
        name: string;
        product: typeof Product;
      }

      const totalAmount = items.reduce((sum: number, item: CartItem) => {
        const itemPrice = item.price - (item.price * item.discount / 100);
        return sum + (itemPrice * item.quantity);
      }, 0);

      const taxAmount = totalAmount * 0.05;
      const shippingFee = 40;
      const finalAmount = totalAmount + taxAmount + shippingFee;

      // Create order
      const order = await Order.create({
        userId: session.user.id,
        sellerId: sellerId,
        items: items.map((item: CartItem) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        status: "pending",
        totalAmount: finalAmount,
        taxAmount: taxAmount,
        discountAmount: 0,
        shippingFee: shippingFee,
        currency: "INR",
        shippingAddress: shippingAddress,
        paymentId: payment._id
      });

      // Update product inventory
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { 
            stock: -item.quantity,
            reserved: item.quantity,
            orderCount: 1
          }
        });
      }

      // Generate OTP and tracking number
      const otpCode = generateOTP();
      const trackingNumber = generateTrackingNumber();

      // Create shipment
      const shipment = await Shipment.create({
        orderId: order._id,
        trackingNumber: trackingNumber,
        status: "pending",
        otpCode: otpCode,
        deliveryAddress: shippingAddress,
        customerPhone: user.phone || shippingAddress.phone || "",
        customerName: user.name || "",
        events: [{
          status: "pending",
          timestamp: new Date(),
          note: "Order placed, awaiting assignment"
        }]
      });

      // Update order with shipment ID
      order.shipmentId = shipment._id;
      await order.save();

      // Link the first order to the payment
      if (!firstOrderId) {
        firstOrderId = order._id;
        payment.orderId = firstOrderId;
        await payment.save();
      }

      // Create notification for seller
      await Notification.create({
        userId: sellerId,
        message: `New order received! Order ID: ${order._id}. Total: ₹${finalAmount}`,
        type: "order",
        isRead: false
      });

      // Send confirmation email
      try {
        await sendOrderConfirmationEmail(
          user.email,
          order._id.toString(),
          otpCode,
          {
            items: items.map((item: CartItem) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            totalAmount: finalAmount,
            shippingAddress: shippingAddress
          }
        );
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      createdOrders.push({
        orderId: order._id,
        trackingNumber: trackingNumber,
        totalAmount: finalAmount,
        otpCode: otpCode
      });
    }

    // Clear the cart only if it was a cart checkout (not direct purchase)
    if (!directItems || directItems.length === 0) {
      await Cart.findOneAndUpdate(
        { userId: session.user.id },
        { items: [] }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and order(s) placed successfully",
      orders: createdOrders
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 }
    );
  }
}
