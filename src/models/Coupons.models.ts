/*
    COUPONS {
        objectId _id PK
        objectId sellerId FK (null for admin coupons)
        string code
        decimal discountValue
        string discountType "flat | percentage"
        date validFrom
        date validTo
        int usageLimit
        int usedCount
        decimal minOrderValue
        bool isActive
    }
*/

import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProfile",
      default: null, // null means admin/platform coupon
    },
    code: { type: String, required: true, unique: true },
    discountValue: { type: Number, required: true },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 }, // 0 means unlimited
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for faster seller queries
CouponSchema.index({ sellerId: 1, isActive: 1 });
CouponSchema.index({ code: 1 });

const Coupon = mongoose.models?.Coupon || mongoose.model("Coupon", CouponSchema);

export default Coupon;