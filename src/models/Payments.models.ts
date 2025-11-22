/*
    PAYMENTS {
        objectId _id
        objectId orderId FK
        string method
        string provider
        string transactionId
        string status "pending | success | failed | refunded"
        decimal amount
        string currency
        date createdAt
    }
*/

import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      // Removed unique index - one payment can be used for multiple orders
    },
    paymentMethod: { 
      type: String, 
      required: true,
      enum: ["razorpay", "cod", "credit_card", "debit_card", "upi", "netbanking"]
    },
    provider: { type: String }, // e.g., Razorpay, Stripe, etc.
    transactionId: { type: String },
    razorpayOrderId: { type: String, sparse: true }, // sparse allows multiple null values
    razorpayPaymentId: { type: String, sparse: true },
    razorpaySignature: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

// Ensure no unique index on orderId
PaymentSchema.index({ orderId: 1 }, { unique: false });

const Payment =
  mongoose.models?.Payment || mongoose.model("Payment", PaymentSchema);

export default Payment;