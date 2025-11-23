import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/Session";
import { dbConnect } from "@/lib/db";
import Cart from "@/models/Cart.models";
import Product from "@/models/Products.models";
import Order from "@/models/Orders.models";
import Shipment from "@/models/Shipments.models";
import Notification from "@/models/Notifications.models";
import User from "@/models/User.models";
import { generateOTP, generateTrackingNumber } from "@/lib/delivery-utils";
import { sendOrderConfirmationEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { shippingAddress, items: directItems } = await req.json();

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
      const productIds = directItems.map((item: { productId: string; quantity: number }) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).populate('sellerId');
      
      cartItems = {
        items: directItems.map((item: { productId: string; quantity: number }) => {
          const product = products.find((p) => p._id.toString() === item.productId);
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
    }

    const createdOrders = [];

    // Create separate orders for each seller
    for (const [sellerId, items] of sellerGroups) {
      // Calculate totals
      interface CartItem {
        productId: string;
        quantity: number;
        price: number;
        discount: number;
        name: string;
        product: typeof Product;
      }

      const totalAmount = items.reduce((sum: number, item: CartItem) => {
        const itemPrice = item.price - item.discount;
        return sum + (itemPrice * item.quantity);
      }, 0);

      const taxAmount = totalAmount * 0.05; // 5% tax
      const shippingFee = 40; // Fixed shipping fee
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
        shippingAddress: shippingAddress
      });

      // Update product inventory (reduce stock, increase reserved)
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { 
            stock: -item.quantity,
            reserved: item.quantity,
            orderCount: 1
          }
        });
      }

      // Generate OTP for delivery verification
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

      // Create notification for seller
      await Notification.create({
        userId: sellerId,
        message: `New order received! Order ID: ${order._id}. Total: ₹${finalAmount}`,
        type: "order",
        isRead: false
      });

      // Send confirmation email to customer
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
        // Don't fail the order if email fails
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
      message: "Order(s) placed successfully",
      orders: createdOrders
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process checkout" },
      { status: 500 }
    );
  }
}
