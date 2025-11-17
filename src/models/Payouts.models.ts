/*
    PAYOUTS {
        objectId _id PK
        objectId sellerId FK
        objectId orderId FK
        decimal amount
        decimal platformCommission
        decimal taxDeducted
        decimal netAmount
        string status "pending | processing | completed | failed"
        date payoutDate
        string transactionId
        date createdAt
        date updatedAt
    }
*/

import mongoose from "mongoose";

const PayoutSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProfile",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    amount: { type: Number, required: true }, // Order amount
    platformCommission: { type: Number, default: 0 }, // Platform fee
    taxDeducted: { type: Number, default: 0 }, // TDS or other taxes
    netAmount: { type: Number, required: true }, // Final payout amount
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    payoutDate: { type: Date },
    transactionId: { type: String },
  },
  { timestamps: true }
);

// Index for faster seller queries
PayoutSchema.index({ sellerId: 1, status: 1 });
PayoutSchema.index({ orderId: 1 });

const Payout =
  mongoose.models?.Payout || mongoose.model("Payout", PayoutSchema);

export default Payout;
