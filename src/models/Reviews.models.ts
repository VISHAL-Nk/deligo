/*

    REVIEWS {
        objectId _id PK
        objectId userId FK
        objectId productId FK
        int rating
        string comment
        array images
        date createdAt
    }
*/

import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

const Review = mongoose.models?.Review || mongoose.model("Review", ReviewSchema);

export default Review;