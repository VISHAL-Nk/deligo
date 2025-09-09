/*
    CUSTOMER_SUPPORT_TICKETS {
        objectId _id PK
        objectId userId FK
        objectId supportAgentId FK
        string subject
        string status "open | in-progress | resolved | closed"
        array_object messages "subdocs: {senderId, message, createdAt}"
        date createdAt
    }
*/

import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const CustomerSupportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supportAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportAgent",
    },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    messages: { type: [MessageSchema], default: [] }, // Array of message subdocuments
  },
  { timestamps: true }
);

const CustomerSupportTicket =
  mongoose.models.CustomerSupportTicket ||
  mongoose.model("CustomerSupportTicket", CustomerSupportTicketSchema);

export default CustomerSupportTicket;   