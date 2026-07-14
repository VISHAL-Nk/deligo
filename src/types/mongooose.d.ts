// types/mongoose.d.ts
import { Document, ObjectId } from "mongoose";

export interface UserDocument extends Document {
  _id: ObjectId;
  email: string;
  passwordHash?: string;
  role: "customer" | "seller" | "delivery" | "support" | "admin";
  isVerified: boolean;
  hasProfile: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Global window extensions for Deligo chat widget
declare global {
  interface Window {
    DELIGO_CHAT_USER_ID?: string;
    DELIGO_CHAT_API_BASE?: string;
  }
}
