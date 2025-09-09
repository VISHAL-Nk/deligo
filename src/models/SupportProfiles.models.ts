/*
    SUPPORT_PROFILES {
        objectId userId FK
        string department
        string shift
        string specialization
    }
*/

import mongoose from "mongoose";

const SupportProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    department: { type: String, required: true },
    shift: { type: String, required: true },
    specialization: { type: String, required: true },
  },
  { timestamps: true }
);

const SupportProfile =
  mongoose.models.SupportProfile ||
  mongoose.model("SupportProfile", SupportProfileSchema);

export default SupportProfile;