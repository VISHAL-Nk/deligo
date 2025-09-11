/*
    ADMINS {
        objectId userId FK
        string role "super-admin | moderator | finance"
        string[] permissions
    }
*/

import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "moderator", "finance"],
      default: "moderator",
    },
    permissions: { type: [String], default: [] }, // Array of permission strings
  },
  { timestamps: true }
);

const Admin =
  mongoose.models?.Admin || mongoose.model("Admin", AdminSchema);

export default Admin;