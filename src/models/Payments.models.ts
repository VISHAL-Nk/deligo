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
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    method: { type: String, required: true }, // e.g., credit_card, paypal, etc.
    provider: { type: String }, // e.g., Stripe, PayPal, etc.
    transactionId: { type: String, unique: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

export default Payment;