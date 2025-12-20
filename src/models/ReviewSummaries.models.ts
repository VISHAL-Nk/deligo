/**
 * ReviewSummaries Model
 * 
 * Stores AI-generated summaries of product reviews.
 * Summaries are cached to avoid regenerating them on every request.
 */

import mongoose from "mongoose";

const ReviewSummarySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true, // One summary per product
    },
    summary: {
      type: String,
      required: true,
    },
    pros: {
      type: [String],
      default: [],
    },
    cons: {
      type: [String],
      default: [],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed'],
      default: 'neutral',
    },
    keyTopics: {
      type: [String],
      default: [],
    },
    averageRating: {
      type: Number,
      required: true,
    },
    totalReviews: {
      type: Number,
      required: true,
    },
    reviewCount: {
      type: Number,
      required: true,
      description: "Number of reviews when summary was generated - used to detect if update needed",
    },
    lastReviewDate: {
      type: Date,
      required: true,
      description: "Date of most recent review when summary was generated",
    },
  },
  { 
    timestamps: true,
  }
);

// Index for fast lookup by product
ReviewSummarySchema.index({ productId: 1 });

// Method to check if summary needs updating
ReviewSummarySchema.methods.needsUpdate = function(currentReviewCount: number, latestReviewDate: Date): boolean {
  // Update if review count has changed significantly (5+ new reviews or 20% more reviews)
  const reviewDiff = currentReviewCount - this.reviewCount;
  const percentageIncrease = (reviewDiff / this.reviewCount) * 100;
  
  if (reviewDiff >= 5 || percentageIncrease >= 20) {
    return true;
  }
  
  // Update if summary is older than 7 days and there are new reviews
  const summaryAge = Date.now() - this.updatedAt.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  
  if (summaryAge > sevenDaysMs && latestReviewDate > this.lastReviewDate) {
    return true;
  }
  
  return false;
};

// Static method to get or create summary placeholder
ReviewSummarySchema.statics.findByProduct = function(productId: string) {
  return this.findOne({ productId });
};

const ReviewSummary = mongoose.models?.ReviewSummary || mongoose.model("ReviewSummary", ReviewSummarySchema);

export default ReviewSummary;
