/*
    MESSAGES {
        objectId _id PK
        objectId orderId FK
        objectId senderId FK
        objectId receiverId FK
        string message
        array attachments
        boolean isRead
        date createdAt
    }
*/

import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    attachments: { type: [String], default: [] }, // Array of attachment URLs
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster order message queries
MessageSchema.index({ orderId: 1, createdAt: 1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });

const Message =
  mongoose.models?.Message || mongoose.model("Message", MessageSchema);

export default Message;
