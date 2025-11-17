/*
    DRIVER_EARNINGS {
        objectId _id PK
        objectId deliveryPersonId FK
        objectId shipmentId FK
        objectId orderId FK
        decimal baseAmount
        decimal distanceBonus
        decimal peakHourBonus
        decimal tipAmount
        decimal totalAmount
        decimal platformCommission
        decimal netAmount
        string status "pending | processed | paid"
        date earnedAt
        date processedAt
        date createdAt
        date updatedAt
    }
*/

import mongoose from "mongoose";

const DriverEarningsSchema = new mongoose.Schema(
  {
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryProfile",
      required: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    baseAmount: { type: Number, required: true, default: 0 }, // Base delivery fee
    distanceBonus: { type: Number, default: 0 }, // Extra for long distances
    peakHourBonus: { type: Number, default: 0 }, // Peak time bonus
    tipAmount: { type: Number, default: 0 }, // Customer tip
    totalAmount: { type: Number, required: true }, // Sum of all amounts
    platformCommission: { type: Number, default: 0 }, // Platform cut
    netAmount: { type: Number, required: true }, // Amount driver receives
    status: {
      type: String,
      enum: ["pending", "processed", "paid"],
      default: "pending",
    },
    earnedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for efficient queries
DriverEarningsSchema.index({ deliveryPersonId: 1, status: 1 });
DriverEarningsSchema.index({ shipmentId: 1 });
DriverEarningsSchema.index({ earnedAt: -1 });
DriverEarningsSchema.index({ deliveryPersonId: 1, earnedAt: -1 });

const DriverEarnings =
  mongoose.models?.DriverEarnings ||
  mongoose.model("DriverEarnings", DriverEarningsSchema);

export default DriverEarnings;
