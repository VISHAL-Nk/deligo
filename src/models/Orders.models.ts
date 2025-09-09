/*
ORDERS {
    _id: ObjectId,
    userId: ObjectId,          // Reference to USERS
    sellerId: ObjectId,        // Reference to the seller
    items: [
        {
            productId: ObjectId,   // Reference to PRODUCTS
            quantity: Number       // How many units the user ordered
        }
    ],
    paymentId: ObjectId,       // Reference to PAYMENTS
    shipmentId: ObjectId,      // Reference to SHIPMENTS
    status: "pending | confirmed | packed | shipped | delivered | cancelled | refunded",
    totalAmount: Decimal,      // Total order amount (calculated from PRODUCTS + quantity)
    taxAmount: Decimal,        // Total tax
    discountAmount: Decimal,   // Total discount
    shippingFee: Decimal,
    currency: String,
    shippingAddress: Object,   // Snapshot of the user's address at checkout
    createdAt: Date,
    updatedAt: Date
}

*/

import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProfile",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packed",
        "shipped",    
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    }, // Flexible object to store address snapshot
  },
  { timestamps: true }
);

const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;