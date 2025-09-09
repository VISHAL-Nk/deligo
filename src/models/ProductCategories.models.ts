/*
    PRODUCT_CATEGORIES {
        objectId _id
        string name
        objectId parentCategoryId
        array filters
    }
*/

import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    filters: { type: [String], default: [] }, // Array of filter names applicable to this category
  },
  { timestamps: true }
);

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;