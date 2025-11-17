/*
    PRODUCTS {
        objectId _id
        objectId sellerId FK
        string sku
        string name
        string description
        objectId categoryId FK
        decimal price
        string currency
        decimal discount
        array images
        object attributes
        int stock
        int reserved
        int lowStockThreshold
        array variants
        object seo
        int viewCount
        int orderCount
        int returnCount
        string status "active | draft | banned | deleted"
        date createdAt
        date updatedAt
    }
*/

import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Size", "Color"
    values: [{ type: String, required: true }], // e.g., ["Small", "Medium", "Large"]
  },
  { _id: false }
);

const SEOSchema = new mongoose.Schema(
  {
    metaTitle: { type: String },
    metaDescription: { type: String },
    tags: [{ type: String }],
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProfile",
      required: true,
    },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    discount: { type: Number, default: 0 },
    images: { type: [String], default: [] }, // Array of image URLs (cloudinary: sellerId/productId/image.jpg)
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible object for various attributes
    stock: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 }, // Alert threshold
    variants: { type: [VariantSchema], default: [] }, // Product variants
    seo: { type: SEOSchema, default: {} }, // SEO fields
    viewCount: { type: Number, default: 0 }, // Track product views
    orderCount: { type: Number, default: 0 }, // Track order count
    returnCount: { type: Number, default: 0 }, // Track return count
    status: {
      type: String,
      enum: ["active", "draft", "banned", "deleted"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// Add index for faster seller queries
ProductSchema.index({ sellerId: 1, status: 1 });
ProductSchema.index({ sku: 1 }, { unique: true });

const Product =
  mongoose.models?.Product || mongoose.model("Product", ProductSchema);

export default Product;
