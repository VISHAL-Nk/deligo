/*
    AUDIT_LOGS {
        objectId _id PK
        objectId actorId FK
        string action
        object meta
        date createdAt
    }
*/

import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed }, // Flexible field for additional data
  },
  { timestamps: true }
);

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;