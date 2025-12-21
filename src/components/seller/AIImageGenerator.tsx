'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Loader2,
  Download,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Wand2,
  ImagePlus,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

interface PromptTemplate {
  key: string;
  name: string;
  description: string;
}

interface GeneratedImage {
  base64: string;
  contentType: string;
  url?: string;
  selected?: boolean;
}

interface AIImageGeneratorProps {
  productName?: string;
  productDescription?: string;
  onImagesSelected: (images: string[]) => void;
  maxImages?: number;
}

export default function AIImageGenerator({
  productName = '',
  productDescription = '',
  onImagesSelected,
  maxImages = 5,
}: AIImageGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('studio');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(2);

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inferenceSteps, setInferenceSteps] = useState(25);
  const [guidanceScale, setGuidanceScale] = useState(7.5);

  // Check API availability on mount
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const response = await fetch('/api/ai/image-generate');
      const data = await response.json();
      setIsAvailable(data.available);
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch {
      setIsAvailable(false);
    }
  };

  const generateImages = useCallback(async () => {
    if (!productName && !productDescription && !customPrompt) {
      setError('Please enter a product name or description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = useCustomPrompt
        ? {
            prompt: customPrompt,
            count: imageCount,
            options: {
              numInferenceSteps: inferenceSteps,
              guidanceScale: guidanceScale,
            },
          }
        : {
            templateKey: selectedTemplate,
            productDescription: productDescription || productName,
            additionalDetails: additionalDetails || undefined,
            count: imageCount,
            options: {
              numInferenceSteps: inferenceSteps,
              guidanceScale: guidanceScale,
            },
          };

      const response = await fetch('/api/ai/image-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate images');
      }

      // Add selection state to images
      const imagesWithSelection = data.images.map((img: GeneratedImage) => ({
        ...img,
        selected: false,
      }));

      setGeneratedImages(imagesWithSelection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  }, [
    productName,
    productDescription,
    customPrompt,
    useCustomPrompt,
    selectedTemplate,
    additionalDetails,
    imageCount,
    inferenceSteps,
    guidanceScale,
  ]);

  const toggleImageSelection = (index: number) => {
    setGeneratedImages((prev) => {
      const selectedCount = prev.filter((img) => img.selected).length;
      const isCurrentlySelected = prev[index].selected;

      // Check if we can select more
      if (!isCurrentlySelected && selectedCount >= maxImages) {
        setError(`Maximum ${maxImages} images can be selected`);
        return prev;
      }

      setError(null);
      return prev.map((img, i) =>
        i === index ? { ...img, selected: !img.selected } : img
      );
    });
  };

  const handleUseSelectedImages = () => {
    const selectedImages = generatedImages
      .filter((img) => img.selected)
      .map((img) => `data:${img.contentType};base64,${img.base64}`);

    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }

    onImagesSelected(selectedImages);
    setGeneratedImages([]);
    setIsExpanded(false);
  };

  const downloadImage = (image: GeneratedImage, index: number) => {
    const link = document.createElement('a');
    link.href = `data:${image.contentType};base64,${image.base64}`;
    link.download = `ai-generated-${Date.now()}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isAvailable === null) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center gap-2 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking AI availability...</span>
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <span>AI image generation is not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">AI Image Generator</h3>
            <p className="text-sm text-gray-600">
              Generate professional product images with Stable Diffusion SDXL
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white rounded-lg">
            <button
              type="button"
              onClick={() => setUseCustomPrompt(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !useCustomPrompt
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Use Template
            </button>
            <button
              type="button"
              onClick={() => setUseCustomPrompt(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                useCustomPrompt
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Custom Prompt
            </button>
          </div>

          {/* Template Selection */}
          {!useCustomPrompt && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Style Template
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => setSelectedTemplate(template.key)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedTemplate === template.key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {template.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details (Optional)
                </label>
                <input
                  type="text"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="e.g., red color, with packaging, on wooden table"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          {useCustomPrompt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the product image you want to generate..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Be descriptive for best results. Include product type, style, lighting, background, etc.
              </p>
            </div>
          )}

          {/* Image Count */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Number of images:
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setImageCount(num)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    imageCount === num
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-purple-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
            >
              <Wand2 className="w-4 h-4" />
              Advanced Settings
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inference Steps: {inferenceSteps}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={inferenceSteps}
                    onChange={(e) => setInferenceSteps(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <p className="text-xs text-gray-500">
                    Higher = better quality, slower
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guidance Scale: {guidanceScale}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <p className="text-xs text-gray-500">
                    Higher = follows prompt more closely
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={generateImages}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Images...
              </>
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                Generate {imageCount} Image{imageCount > 1 ? 's' : ''}
              </>
            )}
          </button>

          {/* Generation Info */}
          {isGenerating && (
            <div className="text-center text-sm text-gray-500">
              <p>This may take 20-60 seconds depending on server load.</p>
              <p className="text-xs mt-1">Using Stable Diffusion SDXL model</p>
            </div>
          )}

          {/* Generated Images Grid */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Generated Images</h4>
                <button
                  type="button"
                  onClick={generateImages}
                  disabled={isGenerating}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                      image.selected
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => toggleImageSelection(index)}
                  >
                    <Image
                      src={`data:${image.contentType};base64,${image.base64}`}
                      alt={`Generated image ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {/* Selection Overlay */}
                    {image.selected && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <div className="p-2 bg-purple-600 rounded-full">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image, index);
                        }}
                        className="p-2 bg-white/90 rounded-lg shadow hover:bg-white"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Selection hint */}
                    {!image.selected && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        <span className="text-xs bg-white/90 px-2 py-1 rounded text-gray-700">
                          Click to select
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Use Selected Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUseSelectedImages}
                  disabled={generatedImages.filter((img) => img.selected).length === 0}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Use Selected ({generatedImages.filter((img) => img.selected).length})
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedImages([])}
                  className="px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
