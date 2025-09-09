/*
    NOTIFICATIONS {
        objectId _id PK
        objectId userId FK
        string message
        string type "order | payment | promotion | system"
        bool isRead
        date createdAt
    }
*/

import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["order", "payment", "promotion", "system"],
      default: "system",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

export default Notification;