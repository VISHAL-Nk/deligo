import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  generateProductImages,
  generateFromTemplate,
  isHuggingFaceConfigured,
  getPromptTemplates,
  imageToBuffer,
  PROMPT_TEMPLATES,
  type PromptTemplateKey,
  type ImageGenerationOptions,
} from "@/lib/huggingface";
import { uploadProductImage } from "@/lib/cloudinary";

interface SessionUser {
  id: string;
  email: string;
  role: string;
}

// GET - Check API availability and get templates
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = session.user as SessionUser;

    // Only allow sellers to access this endpoint
    if (user.role !== "seller" && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Seller account required." },
        { status: 403 }
      );
    }

    const isConfigured = isHuggingFaceConfigured();
    const templates = getPromptTemplates();

    return NextResponse.json({
      success: true,
      available: isConfigured,
      message: isConfigured
        ? "AI image generation is available"
        : "AI image generation is not configured. Please set HF_TOKEN environment variable.",
      templates,
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      defaultSettings: {
        numInferenceSteps: 25,
        guidanceScale: 7.5,
        width: 1024,
        height: 1024,
      },
    });
  } catch (error) {
    console.error("Error checking AI availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check AI availability" },
      { status: 500 }
    );
  }
}

// POST - Generate product images
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = session.user as SessionUser;

    // Only allow sellers to generate images
    if (user.role !== "seller" && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Seller account required." },
        { status: 403 }
      );
    }

    if (!isHuggingFaceConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "AI image generation is not configured",
          message: "Please contact support to enable AI image generation.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      templateKey,
      productDescription,
      additionalDetails,
      count = 2,
      saveToCloudinary = false,
      productId,
      options = {},
    } = body;

    // Validate input
    if (!prompt && !templateKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Either 'prompt' or 'templateKey' with 'productDescription' is required",
        },
        { status: 400 }
      );
    }

    if (templateKey && !productDescription) {
      return NextResponse.json(
        {
          success: false,
          error: "'productDescription' is required when using a template",
        },
        { status: 400 }
      );
    }

    // Validate template key
    if (templateKey && !(templateKey in PROMPT_TEMPLATES)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid template key. Available templates: ${Object.keys(PROMPT_TEMPLATES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Limit count to prevent abuse
    const imageCount = Math.min(Math.max(1, count), 4);

    // Build generation options
    const generationOptions: ImageGenerationOptions = {
      numInferenceSteps: options.numInferenceSteps || 25,
      guidanceScale: options.guidanceScale || 7.5,
      width: options.width || 1024,
      height: options.height || 1024,
    };

    let result;

    if (templateKey) {
      // Generate using template
      result = await generateFromTemplate(
        templateKey as PromptTemplateKey,
        productDescription,
        imageCount,
        generationOptions,
        additionalDetails
      );
    } else {
      // Generate using custom prompt
      // Add quality enhancements to custom prompts
      const enhancedPrompt = `${prompt}, professional product photography, high quality, 4k, sharp focus`;
      const negativePrompt =
        options.negativePrompt ||
        "blurry, low quality, distorted, watermark, text, amateur";

      result = await generateProductImages(enhancedPrompt, imageCount, {
        ...generationOptions,
        negativePrompt,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate images",
        },
        { status: 500 }
      );
    }

    // Prepare response
    const response: {
      success: boolean;
      images: Array<{
        base64: string;
        contentType: string;
        url?: string;
      }>;
      prompt: string;
      model: string;
      count: number;
    } = {
      success: true,
      images: result.images.map((img) => ({
        base64: img.base64,
        contentType: img.contentType,
      })),
      prompt: result.prompt,
      model: result.model,
      count: result.images.length,
    };

    // Optionally save to Cloudinary
    if (saveToCloudinary && productId) {
      try {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < result.images.length; i++) {
          const buffer = await imageToBuffer(result.images[i]);
          const timestamp = Date.now();
          const filename = `ai-generated-${timestamp}-${i}`;

          const url = await uploadProductImage(
            buffer,
            user.id,
            productId,
            filename
          );

          uploadedUrls.push(url);
          response.images[i].url = url;
        }

        return NextResponse.json({
          ...response,
          savedToCloudinary: true,
          cloudinaryUrls: uploadedUrls,
        });
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        // Still return the generated images even if upload fails
        return NextResponse.json({
          ...response,
          savedToCloudinary: false,
          uploadError: "Failed to save images to cloud storage",
        });
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating images:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate images",
      },
      { status: 500 }
    );
  }
}
