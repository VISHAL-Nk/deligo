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
        string status "active | draft | banned | deleted"
        date createdAt
        date updatedAt
    }
*/

import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerProfile",
      required: true,
    },
    sku: { type: String, required: true, unique: true },
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
    images: { type: [String], default: [] }, // Array of image URLs
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} }, // Flexible object for various attributes
    stock: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "draft", "banned", "deleted"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
