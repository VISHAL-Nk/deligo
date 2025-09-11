/*
    INVENTORY_LOGS {
        objectId _id PK
        objectId productId FK
        objectId operatorId FK
        int quantityChanged
        string reason
        date createdAt
    }
*/

import mongoose from "mongoose";

const InventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantityChanged: { type: Number, required: true },
    reason: { type: String },
  },
  { timestamps: true }
);

const InventoryLog =
  mongoose.models?.InventoryLog ||
  mongoose.model("InventoryLog", InventoryLogSchema);

export default InventoryLog;