/**
 * OpenRouter API Utility
 * 
 * A utility for interacting with the OpenRouter API to access various AI models
 * for tasks like review summarization, sentiment analysis, etc.
 */

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

const DEFAULT_MODEL = 'openai/gpt-3.5-turbo';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Send a chat completion request to OpenRouter
 */
export async function chat(
  messages: OpenRouterMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 1024,
    top_p = 1,
  } = options;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Deligo E-commerce',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
    );
  }

  const data: OpenRouterResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter API');
  }

  return data.choices[0].message.content;
}

/**
 * Review data structure for summarization
 */
export interface ReviewForSummary {
  rating: number;
  comment: string;
  createdAt: string;
}

/**
 * Review summary result structure
 */
export interface ReviewSummaryResult {
  summary: string;
  pros: string[];
  cons: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  averageRating: number;
  totalReviews: number;
  keyTopics: string[];
}

/**
 * Summarize product reviews using AI
 */
export async function summarizeReviews(
  reviews: ReviewForSummary[],
  productName?: string
): Promise<ReviewSummaryResult> {
  if (reviews.length < 5) {
    throw new Error('At least 5 reviews are required for summarization');
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Prepare review text for AI
  const reviewsText = reviews
    .map((r, i) => `Review ${i + 1} (${r.rating}/5 stars): "${r.comment}"`)
    .join('\n\n');

  const systemPrompt = `You are a helpful assistant that analyzes product reviews and provides concise summaries.
Your task is to analyze the given reviews and provide:
1. A brief 2-3 sentence summary of what customers think about the product
2. A list of pros (positive points mentioned by customers)
3. A list of cons (negative points or concerns mentioned by customers)
4. The overall sentiment (positive, neutral, negative, or mixed)
5. Key topics or themes mentioned in the reviews

Respond ONLY in valid JSON format with this exact structure:
{
  "summary": "Brief 2-3 sentence summary",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "sentiment": "positive|neutral|negative|mixed",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

Important:
- Keep pros and cons lists to maximum 5 items each
- Keep key topics to maximum 5 items
- Be concise and specific
- Focus on the most commonly mentioned points
- If there are no clear cons, use an empty array
- Base sentiment on the overall tone and ratings`;

  const userPrompt = productName
    ? `Analyze these ${reviews.length} reviews for "${productName}" with an average rating of ${averageRating.toFixed(1)}/5:\n\n${reviewsText}`
    : `Analyze these ${reviews.length} product reviews with an average rating of ${averageRating.toFixed(1)}/5:\n\n${reviewsText}`;

  try {
    const response = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'openai/gpt-3.5-turbo',
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 800,
      }
    );

    // Parse the JSON response
    const parsed = JSON.parse(response);

    return {
      summary: parsed.summary || 'Unable to generate summary.',
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 5) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 5) : [],
      sentiment: ['positive', 'neutral', 'negative', 'mixed'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'neutral',
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics.slice(0, 5) : [],
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Fallback to basic summary if AI parsing fails
    const sentiment = averageRating >= 4 ? 'positive' : averageRating >= 3 ? 'neutral' : 'negative';
    
    return {
      summary: `Based on ${reviews.length} customer reviews with an average rating of ${averageRating.toFixed(1)}/5 stars.`,
      pros: [],
      cons: [],
      sentiment,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      keyTopics: [],
    };
  }
}

/**
 * Check if OpenRouter API is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

const openrouter = {
  chat,
  summarizeReviews,
  isOpenRouterConfigured,
};

export default openrouter;
