/*
    SHIPMENTS {
        objectId _id PK
        objectId orderId FK
        objectId deliveryPersonId FK
        string courierPartner
        string trackingNumber
        string status "pending | in-transit | delivered | failed"
        date estimatedDelivery
    }
*/

import mongoose from "mongoose";

const ShipmentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryProfile",
    },
    courierPartner: { type: String },
    trackingNumber: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["pending", "in-transit", "delivered", "failed"],
      default: "pending",
    },
    estimatedDelivery: { type: Date },
  },
  { timestamps: true }
);

const Shipment =
  mongoose.models.Shipment || mongoose.model("Shipment", ShipmentSchema);

export default Shipment;