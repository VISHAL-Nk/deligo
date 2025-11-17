/*
    SHIPMENTS {
        objectId _id PK
        objectId orderId FK
        objectId deliveryPersonId FK
        string courierPartner
        string trackingNumber
        string status "pending | assigned | accepted | picked_up | in-transit | delivered | failed | cancelled"
        date estimatedDelivery
        string otpCode // 6-digit OTP for delivery verification
        object currentLocation {lat, lng}
        date pickupTime
        date deliveredTime
        array events [{status, timestamp, location, note}]
        object proof {signature, images[], verifiedAt}
        object pickupAddress
        object deliveryAddress
        string customerPhone
        string customerName
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
      enum: [
        "pending",
        "assigned",
        "accepted",
        "picked_up",
        "in-transit",
        "delivered",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },
    estimatedDelivery: { type: Date },
    otpCode: { type: String }, // 6-digit OTP for verification
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    pickupTime: { type: Date },
    deliveredTime: { type: Date },
    events: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        location: {
          lat: { type: Number },
          lng: { type: Number },
        },
        note: { type: String },
      },
    ],
    proof: {
      signature: { type: String }, // Base64 or URL
      images: [{ type: String }], // Array of image URLs
      verifiedAt: { type: Date },
    },
    pickupAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    deliveryAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    customerPhone: { type: String },
    customerName: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ShipmentSchema.index({ deliveryPersonId: 1, status: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ createdAt: -1 });

const Shipment =
  mongoose.models?.Shipment || mongoose.model("Shipment", ShipmentSchema);

export default Shipment;