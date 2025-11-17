/*
    SELLER_PROFILES {
        objectId userId FK
        string businessName
        string gstNumber
        string panNumber
        object bankDetails "subdoc: {accountMasked, ifsc, bankName}"
        object[] store "subdocs: {name, address}"
        double rating
        string kycStatus "pending | approved | rejected"
        object storefront "subdoc: {logo, banner, bio, contactEmail, contactPhone}"
        boolean maintenanceMode
        object subscription "subdoc: {plan, startDate, endDate, status}"
        array kycDocuments
    }
*/

import mongoose from "mongoose";

const BankDetailsSchema = new mongoose.Schema(
  {
    accountMasked: { type: String, required: true },
    ifsc: { type: String, required: true },
    bankName: { type: String, required: true },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
  },
  { _id: false }
);

const StorefrontSchema = new mongoose.Schema(
  {
    logo: { type: String }, // Cloudinary URL
    banner: { type: String }, // Cloudinary URL
    bio: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
  },
  { _id: false }
);

const SubscriptionSchema = new mongoose.Schema(
  {
    plan: { type: String, enum: ["free", "basic", "premium"], default: "free" },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ["active", "inactive", "expired"], default: "inactive" },
  },
  { _id: false }
);

const SellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: { type: String, required: true },
    gstNumber: { type: String },
    panNumber: { type: String },
    bankDetails: { type: BankDetailsSchema, required: true },
    store: { type: [storeSchema], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    storefront: { type: StorefrontSchema, default: {} }, // Storefront customization
    maintenanceMode: { type: Boolean, default: false }, // Toggle availability
    subscription: { type: SubscriptionSchema, default: {} }, // Seller subscription
    kycDocuments: { type: [String], default: [] }, // Array of document URLs
  },
  { timestamps: true }
);

const SellerProfile =
  mongoose.models?.SellerProfile ||
  mongoose.model("SellerProfile", SellerProfileSchema);

export default SellerProfile;
