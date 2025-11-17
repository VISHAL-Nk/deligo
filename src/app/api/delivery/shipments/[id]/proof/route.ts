import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { dbConnect } from "@/lib/db";
import Shipment from "@/models/Shipments.models";
import DeliveryProfile from "@/models/DeliveryProfiles.models";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/delivery/shipments/[id]/proof - Upload proof of delivery
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = (await getServerSession(authOptions as any)) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "delivery") {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { signature, images } = body;

    // Get delivery profile
    const deliveryProfile = await DeliveryProfile.findOne({
      userId: session.user.id,
    });

    if (!deliveryProfile) {
      return NextResponse.json(
        { success: false, message: "Delivery profile not found" },
        { status: 404 }
      );
    }

    // Get shipment
    const shipment = await Shipment.findById(id);

    if (!shipment) {
      return NextResponse.json(
        { success: false, message: "Shipment not found" },
        { status: 404 }
      );
    }

    // Verify shipment is assigned to this driver
    if (shipment.deliveryPersonId?.toString() !== deliveryProfile._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Not authorized for this shipment" },
        { status: 403 }
      );
    }

    // Initialize proof object if not exists
    if (!shipment.proof) {
      shipment.proof = {};
    }

    // Upload signature if provided (base64)
    if (signature) {
      shipment.proof.signature = signature;
    }

    // Upload images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadedImages = [];

      for (const imageData of images) {
        try {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(imageData, {
            folder: "delivery-proofs",
            resource_type: "auto",
          });
          uploadedImages.push(result.secure_url);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
        }
      }

      shipment.proof.images = uploadedImages;
    }

    await shipment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Proof of delivery uploaded successfully",
        data: {
          proof: shipment.proof,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading proof:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload proof",
      },
      { status: 500 }
    );
  }
}
