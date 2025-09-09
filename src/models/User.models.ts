/* 
USERS {
    objectId _id
    string email
    string passwordHash
    string role "customer | seller | delivery | support | admin"
    bool isVerified
    date createdAt
    date updatedAt
    date lastLoginAt
    }
*/

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "seller", "delivery", "support", "admin"],
      default: "customer",
    },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
