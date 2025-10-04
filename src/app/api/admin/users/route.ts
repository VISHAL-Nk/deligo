// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User.models";
import UserProfile from "@/models/UserProfiles.models";
import SellerProfile from "@/models/SellerProfiles.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import { Session } from "@/lib/Session";

export async function GET(req: NextRequest) {
  try {
    const session = await Session();
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role");

    let query = {};
    if (role && role !== "all") {
      query = { role };
    }

    const users = await User.find(query).select("-passwordHash").lean();

    // Fetch profiles for each user
    const usersWithProfiles = await Promise.all(
      users.map(async (user: Record<string, unknown>) => {
        let profile = null;
        const userId = user._id as string;
        const userRole = user.role as string;

        if (userRole === "customer") {
          profile = await UserProfile.findOne({ userId }).lean();
        } else if (userRole === "seller") {
          profile = await SellerProfile.findOne({ userId }).lean();
        } else if (userRole === "delivery") {
          profile = await DeliveryProfile.findOne({ userId }).lean();
        }

        return {
          ...user,
          _id: userId.toString(),
          profile,
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithProfiles,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await Session();
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, action } = body;

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "deactivate") {
      user.isVerified = false;
      await user.save();
    } else if (action === "activate") {
      user.isVerified = true;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await Session();
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete associated profiles
    if (user.role === "customer") {
      await UserProfile.findOneAndDelete({ userId });
    } else if (user.role === "seller") {
      await SellerProfile.findOneAndDelete({ userId });
    } else if (user.role === "delivery") {
      await DeliveryProfile.findOneAndDelete({ userId });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
