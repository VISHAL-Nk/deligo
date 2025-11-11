// src/app/api/admin/hero/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import mongoose from "mongoose";

// Hero Section Schema
const HeroSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const HeroSection = mongoose.models?.HeroSection || mongoose.model("HeroSection", HeroSectionSchema);

export async function GET() {
  try {
    await dbConnect();

    const heroSection = await HeroSection.findOne({ isActive: true }).lean();

    if (!heroSection) {
      // Return default values if no hero section exists
      return NextResponse.json({
        success: true,
        hero: {
          title: "Welcome to Deligo",
          description: "Your one-stop shop for everything you need",
          imageUrl: "https://res.cloudinary.com/dom4xev0l/image/upload/v1762839187/84ba0018-a2f3-4916-8f67-8797e5d58479.png",
        },
      });
    }

    return NextResponse.json({
      success: true,
      hero: heroSection,
    });
  } catch (error) {
    console.error("Error fetching hero section:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero section" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    
    // Check if user is admin - either current role or original role (for role simulation)
    const isAdmin = session?.user?.role === "admin" || session?.user?.originalRole === "admin";
    
    if (!session || !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, imageUrl } = body;

    if (!title || !description || !imageUrl) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Deactivate all existing hero sections
    await HeroSection.updateMany({}, { isActive: false });

    // Create new hero section
    const heroSection = await HeroSection.create({
      title,
      description,
      imageUrl,
      updatedBy: session.user.id,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Hero section updated successfully",
      hero: heroSection,
    });
  } catch (error) {
    console.error("Error updating hero section:", error);
    return NextResponse.json(
      { error: "Failed to update hero section" },
      { status: 500 }
    );
  }
}