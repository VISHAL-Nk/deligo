/*
DELIVERY_PROFILES {
    objectId userId FK                
    string vehicleType                   // bike | scooter | car | van
    string licenseNumber                 
    string region                       
    bool isAvailable                     
    bool isOnline
    double rating                        // Average rating from customers/stores
    array currentAssignments             
    array completedAssignments           
    string status "active | inactive | suspended"
    kycStatus "pending | approved | rejected"
    date lastLoginAt
    object lastLocation {lat, lng, timestamp}
    object earnings {total, pending, paid}
    int totalDeliveries
    int completedDeliveries
    object kycDocuments {license, insurance, vehicle}
    object bankDetails {accountNumber, ifsc, accountHolderName}
    date createdAt
    date updatedAt
}

*/

import mongoose from "mongoose";

const DeliveryProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ["bike", "scooter", "car", "van"],
      required: true,
    },
    licenseNumber: { type: String, required: true, unique: true },
    region: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    isOnline: { type: Boolean, default: false },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    currentAssignments: { type: [String], default: [] }, // Array of assignment IDs or descriptions
    completedAssignments: { type: [String], default: [] }, // Array of assignment IDs or descriptions
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    lastLoginAt: { type: Date },
    lastLocation: {
      lat: { type: Number },
      lng: { type: Number },
      timestamp: { type: Date },
    },
    earnings: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      paid: { type: Number, default: 0 },
    },
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    kycDocuments: {
      license: { type: String }, // URL to license image
      insurance: { type: String }, // URL to insurance document
      vehicle: { type: String }, // URL to vehicle registration
    },
    bankDetails: {
      accountNumber: { type: String },
      ifsc: { type: String },
      accountHolderName: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
DeliveryProfileSchema.index({ isOnline: 1, isAvailable: 1, region: 1 });
DeliveryProfileSchema.index({ kycStatus: 1 });

const DeliveryProfile =
  mongoose.models?.DeliveryProfile ||
  mongoose.model("DeliveryProfile", DeliveryProfileSchema);

export default DeliveryProfile;
