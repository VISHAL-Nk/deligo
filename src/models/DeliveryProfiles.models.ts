/*
DELIVERY_PROFILES {
    objectId userId FK                
    string vehicleType                   // bike | scooter | car | van
    string licenseNumber                 
    string region                       
    bool isAvailable                     
    double rating                        // Average rating from customers/stores
    array currentAssignments             
    array completedAssignments           
    string status "active | inactive | suspended"
    kycStatus "pending | approved | rejected"
    date lastLoginAt                    
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
  },
  { timestamps: true }
);

const DeliveryProfile =
  mongoose.models?.DeliveryProfile ||
  mongoose.model("DeliveryProfile", DeliveryProfileSchema);

export default DeliveryProfile;
