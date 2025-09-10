// types/mongoose.d.ts
import { Document, ObjectId } from "mongoose";

export interface UserDocument extends Document {
  _id: ObjectId;
  email: string;
  passwordHash?: string;
  role: "customer" | "seller" | "delivery" | "support" | "admin";
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
