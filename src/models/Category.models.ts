import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // null for top-level categories
    },
    slug: {
      type: String,
      required: true,
      unique: true, // for SEO-friendly URLs
      lowercase: true,
      trim: true,
    },
    image: {
      type: String, // single representative image (optional)
      default: null,
    },
    attributes: {
      type: [String], // optional category-level attributes (e.g., "color", "size")
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Category =
  mongoose.models?.Category || mongoose.model("Category", CategorySchema);

export default Category;
