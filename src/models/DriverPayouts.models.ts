/*
    DRIVER_PAYOUTS {
        objectId _id PK
        objectId deliveryPersonId FK
        decimal amount
        decimal processingFee
        decimal netAmount
        string status "pending | processing | completed | failed"
        string paymentMethod "bank_transfer | upi | wallet"
        object bankDetails {accountNumber, ifsc, accountHolderName}
        string upiId
        string transactionId
        date requestedAt
        date processedAt
        date completedAt
        string failureReason
        date createdAt
        date updatedAt
    }
*/

import mongoose from "mongoose";

const DriverPayoutSchema = new mongoose.Schema(
  {
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryProfile",
      required: true,
    },
    amount: { type: Number, required: true }, // Requested payout amount
    processingFee: { type: Number, default: 0 }, // Any processing charges
    netAmount: { type: Number, required: true }, // Final payout amount
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "wallet"],
      default: "bank_transfer",
    },
    bankDetails: {
      accountNumber: { type: String },
      ifsc: { type: String },
      accountHolderName: { type: String },
    },
    upiId: { type: String },
    transactionId: { type: String },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient queries
DriverPayoutSchema.index({ deliveryPersonId: 1, status: 1 });
DriverPayoutSchema.index({ status: 1 });
DriverPayoutSchema.index({ requestedAt: -1 });

const DriverPayout =
  mongoose.models?.DriverPayout ||
  mongoose.model("DriverPayout", DriverPayoutSchema);

export default DriverPayout;
