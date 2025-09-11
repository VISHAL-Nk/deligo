/*
    COUPONS {
        objectId _id PK
        string code
        decimal discountValue
        string discountType "flat | percentage"
        date validFrom
        date validTo
        bool isActive
    }
*/

import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountValue: { type: Number, required: true },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Coupon = mongoose.models?.Coupon || mongoose.model("Coupon", CouponSchema);

export default Coupon;