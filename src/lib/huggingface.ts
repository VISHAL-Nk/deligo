/**
 * Hugging Face Inference API Utility
 *
 * A utility for interacting with Hugging Face's Inference API
 * for AI image generation using Stable Diffusion SDXL model.
 */

import { InferenceClient } from "@huggingface/inference";

// Default model configuration
const DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";
const DEFAULT_PROVIDER = "nscale";

export interface ImageGenerationOptions {
  model?: string;
  provider?: string;
  numInferenceSteps?: number;
  guidanceScale?: number;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface GeneratedImage {
  blob: Blob;
  base64: string;
  contentType: string;
}

export interface ImageGenerationResult {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  prompt: string;
  model: string;
}

// Product image prompt templates
export const PROMPT_TEMPLATES = {
  studio: {
    name: "Studio Photography",
    description: "Clean studio shot with professional lighting",
    template:
      "Professional product photography of {product}, studio lighting, clean white background, high resolution, commercial quality, 4k, sharp focus, professional lighting setup",
    negativePrompt:
      "blurry, low quality, distorted, watermark, text, logo, cluttered background, amateur, dark, shadowy",
  },
  lifestyle: {
    name: "Lifestyle Shot",
    description: "Product in a real-world context",
    template:
      "Lifestyle product photography of {product}, natural setting, warm lighting, cozy atmosphere, realistic environment, professional photography, high quality, 4k",
    negativePrompt:
      "blurry, low quality, distorted, watermark, text, artificial looking, oversaturated",
  },
  minimalist: {
    name: "Minimalist",
    description: "Clean, minimalist aesthetic",
    template:
      "Minimalist product photo of {product}, simple composition, soft shadows, neutral background, elegant, modern aesthetic, high-end commercial photography, 4k",
    negativePrompt:
      "cluttered, busy background, harsh shadows, low quality, blurry, distorted",
  },
  outdoor: {
    name: "Outdoor Setting",
    description: "Natural outdoor environment",
    template:
      "Outdoor product photography of {product}, natural daylight, nature background, fresh and vibrant, professional quality, 4k, sharp details",
    negativePrompt:
      "indoor, artificial lighting, blurry, low quality, distorted, dark, gloomy",
  },
  seasonal: {
    name: "Seasonal Theme",
    description: "Festive or seasonal styling",
    template:
      "Festive product photography of {product}, seasonal decorations, warm holiday atmosphere, professional commercial shot, high quality, 4k",
    negativePrompt:
      "plain background, low quality, blurry, distorted, amateur, dark",
  },
  luxury: {
    name: "Luxury Premium",
    description: "High-end, premium look",
    template:
      "Luxury product photography of {product}, premium aesthetic, elegant composition, dramatic lighting, high-end commercial quality, sophisticated, 4k, sharp focus",
    negativePrompt:
      "cheap looking, low quality, blurry, cluttered, amateur, distorted",
  },
  flatLay: {
    name: "Flat Lay",
    description: "Top-down flat lay composition",
    template:
      "Flat lay product photography of {product}, top-down view, styled composition, complementary props, clean aesthetic, professional commercial shot, 4k",
    negativePrompt:
      "angled view, cluttered, messy, low quality, blurry, distorted",
  },
  closeup: {
    name: "Close-up Detail",
    description: "Detailed close-up shot",
    template:
      "Macro close-up product photography of {product}, detailed texture, sharp focus, professional lighting, high resolution, commercial quality, 4k",
    negativePrompt:
      "blurry, out of focus, low resolution, distorted, amateur, dark",
  },
} as const;

export type PromptTemplateKey = keyof typeof PROMPT_TEMPLATES;

/**
 * Check if Hugging Face API is configured
 */
export function isHuggingFaceConfigured(): boolean {
  return !!process.env.HF_TOKEN;
}

/**
 * Get Hugging Face Inference Client
 */
function getClient(): InferenceClient {
  const token = process.env.HF_TOKEN;

  if (!token) {
    throw new Error("HF_TOKEN environment variable is not set");
  }

  return new InferenceClient(token);
}

/**
 * Generate a product image from text prompt
 */
export async function generateProductImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<GeneratedImage> {
  const client = getClient();

  const {
    model = DEFAULT_MODEL,
    provider = DEFAULT_PROVIDER,
    numInferenceSteps = 25,
    guidanceScale = 7.5,
    negativePrompt,
    width = 1024,
    height = 1024,
    seed,
  } = options;

  try {
    // Build parameters object
    const parameters: Record<string, unknown> = {
      num_inference_steps: numInferenceSteps,
      guidance_scale: guidanceScale,
      width,
      height,
    };

    if (negativePrompt) {
      parameters.negative_prompt = negativePrompt;
    }

    if (seed !== undefined) {
      parameters.seed = seed;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageResult: any = await client.textToImage({
      provider: provider as "nscale",
      model,
      inputs: prompt,
      parameters,
    });

    // Handle different return types from the API
    let imageBlob: Blob;
    
    if (imageResult instanceof Blob) {
      imageBlob = imageResult;
    } else if (typeof imageResult === 'string') {
      // If it's a base64 string or URL, fetch it
      if (imageResult.startsWith('data:')) {
        const base64Data = imageResult.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        imageBlob = new Blob([buffer], { type: 'image/png' });
      } else {
        // It might be a URL
        const response = await fetch(imageResult);
        imageBlob = await response.blob();
      }
    } else {
      throw new Error('Unexpected response format from image generation API');
    }

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      blob: imageBlob,
      base64,
      contentType: imageBlob.type || "image/png",
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(
      `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate multiple product images with variations
 */
export async function generateProductImages(
  prompt: string,
  count: number = 2,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  if (!isHuggingFaceConfigured()) {
    return {
      success: false,
      images: [],
      error: "Hugging Face API is not configured",
      prompt,
      model: options.model || DEFAULT_MODEL,
    };
  }

  try {
    const images: GeneratedImage[] = [];

    // Generate images sequentially to avoid rate limiting
    for (let i = 0; i < count; i++) {
      // Add slight variation with different seeds if not specified
      const imageOptions = {
        ...options,
        seed: options.seed !== undefined ? options.seed + i : Date.now() + i,
      };

      const image = await generateProductImage(prompt, imageOptions);
      images.push(image);
    }

    return {
      success: true,
      images,
      prompt,
      model: options.model || DEFAULT_MODEL,
    };
  } catch (error) {
    return {
      success: false,
      images: [],
      error: error instanceof Error ? error.message : "Failed to generate images",
      prompt,
      model: options.model || DEFAULT_MODEL,
    };
  }
}

/**
 * Build a product image prompt from template
 */
export function buildPromptFromTemplate(
  templateKey: PromptTemplateKey,
  productDescription: string,
  additionalDetails?: string
): { prompt: string; negativePrompt: string } {
  const template = PROMPT_TEMPLATES[templateKey];

  let prompt = template.template.replace("{product}", productDescription);

  if (additionalDetails) {
    prompt += `, ${additionalDetails}`;
  }

  return {
    prompt,
    negativePrompt: template.negativePrompt,
  };
}

/**
 * Generate product images using a template
 */
export async function generateFromTemplate(
  templateKey: PromptTemplateKey,
  productDescription: string,
  count: number = 2,
  options: Omit<ImageGenerationOptions, "negativePrompt"> = {},
  additionalDetails?: string
): Promise<ImageGenerationResult> {
  const { prompt, negativePrompt } = buildPromptFromTemplate(
    templateKey,
    productDescription,
    additionalDetails
  );

  return generateProductImages(prompt, count, {
    ...options,
    negativePrompt,
  });
}

/**
 * Convert generated image to Buffer for Cloudinary upload
 */
export async function imageToBuffer(image: GeneratedImage): Promise<Buffer> {
  const arrayBuffer = await image.blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get all available prompt templates
 */
export function getPromptTemplates(): Array<{
  key: PromptTemplateKey;
  name: string;
  description: string;
}> {
  return Object.entries(PROMPT_TEMPLATES).map(([key, value]) => ({
    key: key as PromptTemplateKey,
    name: value.name,
    description: value.description,
  }));
}
