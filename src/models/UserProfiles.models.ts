/*
    USER_PROFILES {
        objectId userId FK
        string fullName
        string phone
        string gender
        date dateOfBirth
        object[] addresses "subdocs: {label, line1, city, state, postalCode, country, geo}"
        object preferences
    }
*/

import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const UserProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: { type: String },
    phone: { type: String },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Prefer not to say"],
      default: "Prefer not to say",
    },
    dateOfBirth: { type: Date },
    addresses: { type: [AddressSchema], default: [] },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const UserProfile =
  mongoose.models?.UserProfile ||
  mongoose.model("UserProfile", UserProfileSchema);

export default UserProfile;
