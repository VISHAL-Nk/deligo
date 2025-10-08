// src/app/api/admin/role-switch/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import { Session } from "@/lib/Session";

export async function POST(req: NextRequest) {
  try {
    const session = await Session();
    
    // Check if user is admin - either current role or original role
    const isAdmin = session?.user?.role === "admin" || session?.user?.originalRole === "admin";
    
    if (!session || !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { role } = body;

    if (!role || !["customer", "seller", "delivery", "support", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Store original role if not already stored (and if current role is admin)
    if (!user.originalRole && user.role === "admin") {
      user.originalRole = user.role;
    }

    user.role = role;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Switched to ${role} role`,
      role,
      originalRole: user.originalRole,
    });
  } catch (error) {
    console.error("Error switching role:", error);
    return NextResponse.json(
      { error: "Failed to switch role" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await Session();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Restore original role
    if (user.originalRole) {
      user.role = user.originalRole;
      user.originalRole = undefined;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: "Restored to original role",
      role: user.role,
    });
  } catch (error) {
    console.error("Error restoring role:", error);
    return NextResponse.json(
      { error: "Failed to restore role" },
      { status: 500 }
    );
  }
}
