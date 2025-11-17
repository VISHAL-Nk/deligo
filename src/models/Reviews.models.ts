/*

    REVIEWS {
        objectId _id PK
        objectId userId FK
        objectId productId FK
        int rating
        string comment
        array images
        objectId sellerReply
        boolean reported
        string reportReason
        date createdAt
    }
*/

import mongoose from "mongoose";

const SellerReplySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    images: { type: [String], default: [] }, // Array of image URLs
    sellerReply: { type: SellerReplySchema }, // Seller's response to review
    reported: { type: Boolean, default: false }, // Flag for inappropriate content
    reportReason: { type: String }, // Reason for reporting
  },
  { timestamps: true }
);

// Indexes for faster review queries
ReviewSchema.index({ productId: 1, userId: 1 });
ReviewSchema.index({ userId: 1 });

const Review = mongoose.models?.Review || mongoose.model("Review", ReviewSchema);

export default Review;