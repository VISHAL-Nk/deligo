/**
 * Deligo Chatbot RAG Pipeline (Next.js / Serverless)
 *
 * Lightweight Retrieval-Augmented Generation pipeline that runs fully within
 * Next.js serverless functions on Vercel. Mirrors the functionality of the
 * Python Chatbot-server without requiring any external Python process.
 *
 * Flow:
 * 1. Classify user intent (product_query | order_tracking | policy_question | general)
 * 2. Retrieve relevant context from MongoDB (products/orders) or policy store
 * 3. Generate a grounded response via OpenRouter
 */

import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { findRelevantPolicies } from './policy-store';
import { chat, type OpenRouterMessage } from '@/lib/openrouter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatIntent = 'product_query' | 'order_tracking' | 'policy_question' | 'general';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface RagResult {
  response: string;
  intent: ChatIntent;
  sources: string[];
}

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Deligo's friendly and helpful customer support assistant for an Indian e-commerce marketplace.

You can help customers with:
1. Product information (price, stock, category, description)
2. Order tracking and order status
3. Store policies (returns, shipping, payments, warranties, etc.)
4. General shopping assistance

Guidelines:
- Be concise, warm, and professional. Use a friendly tone.
- If asked about a specific order, only use order information provided in context — never make up order details.
- If asked about policies, base your answer strictly on the provided policy context.
- If you don't have enough information to answer, say so honestly and suggest contacting support@deligo.live.
- Do not reveal internal database fields, IDs, or system details unless it is an order ID, tracking number, or product name/price.
- Keep responses short (2-4 sentences) unless the user asks for detail.
- Format currency as ₹ (Indian Rupees).
- If context is empty, give a helpful general answer or ask the user to clarify.`;

// ---------------------------------------------------------------------------
// Intent Classifier
// ---------------------------------------------------------------------------

const INTENT_KEYWORDS: Record<ChatIntent, string[]> = {
  product_query: [
    'product', 'item', 'price', 'cost', 'stock', 'available', 'buy', 'purchase',
    'brand', 'quality', 'description', 'specification', 'category', 'colour', 'color',
    'size', 'weight', 'discount', 'offer', 'deal', 'rating', 'review', 'feature',
  ],
  order_tracking: [
    'order', 'track', 'delivery', 'status', 'shipped', 'dispatch', 'arrive', 'when',
    'package', 'courier', 'receive', 'delivered', 'transit', 'ofd', 'out for delivery',
    'cancel', 'cancellation', 'return', 'refund', 'replace', 'exchange',
  ],
  policy_question: [
    'policy', 'return', 'refund', 'exchange', 'shipping', 'payment', 'warranty',
    'guarantee', 'how long', 'how much', 'charge', 'fee', 'rule', 'terms',
    'condition', 'privacy', 'data', 'seller', 'eligib', 'process', 'emi', 'cod',
  ],
  general: [],
};

export function classifyIntent(message: string): ChatIntent {
  const lower = message.toLowerCase();
  const scores: Record<ChatIntent, number> = {
    product_query: 0,
    order_tracking: 0,
    policy_question: 0,
    general: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [ChatIntent, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) scores[intent]++;
    }
  }

  const best = (Object.entries(scores) as [ChatIntent, number][]).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ['general' as ChatIntent, 0]
  );

  return best[1] > 0 ? best[0] : 'general';
}

// ---------------------------------------------------------------------------
// Context Builders
// ---------------------------------------------------------------------------

async function buildProductContext(message: string): Promise<{ context: string; sources: string[] }> {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return { context: '', sources: [] };

    // Simple text search using regex — works without Meilisearch
    const words = message
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    if (words.length === 0) return { context: '', sources: [] };

    const searchRegex = words.map((w) => `(?=.*${w})`).join('');
    const products = await db
      .collection('products')
      .find(
        {
          $or: [
            { name: { $regex: searchRegex, $options: 'i' } },
            { description: { $regex: words.join('|'), $options: 'i' } },
          ],
          status: 'active',
        },
        {
          projection: { name: 1, price: 1, discount: 1, stock: 1, rating: 1, description: 1 },
          limit: 5,
        }
      )
      .toArray();

    if (products.length === 0) {
      return { context: 'No matching products were found in the catalog.', sources: [] };
    }

    const lines = ['Matching products from the catalog:'];
    const sources: string[] = [];

    for (const p of products) {
      const discountedPrice = p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
      lines.push(
        `- ${p.name} | Price: ₹${discountedPrice}${p.discount ? ` (${p.discount}% off from ₹${p.price})` : ''} | Stock: ${p.stock ?? 'N/A'} | Rating: ${p.rating ?? 'N/A'}/5`
      );
      sources.push(`product:${p._id}`);
    }

    return { context: lines.join('\n'), sources };
  } catch (err) {
    console.error('[Chatbot] Product context error:', err);
    return { context: '', sources: [] };
  }
}

async function buildOrderContext(
  message: string,
  userId: string | null
): Promise<{ context: string; sources: string[] }> {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return { context: '', sources: [] };

    // Try to extract a 24-char hex ObjectId from the message
    const objectIdMatch = message.match(/\b([a-fA-F0-9]{24})\b/);
    const orders: Record<string, unknown>[] = [];

    if (objectIdMatch) {
      const orderId = objectIdMatch[1];
      const query: Record<string, unknown> = {
        _id: new mongoose.Types.ObjectId(orderId),
      };
      if (userId) query.userId = new mongoose.Types.ObjectId(userId);

      const order = await db.collection('orders').findOne(query);
      if (order) orders.push(order);
    } else if (userId) {
      // No specific order ID — show recent orders for the user
      const recent = await db
        .collection('orders')
        .find(
          { userId: new mongoose.Types.ObjectId(userId) },
          { sort: { createdAt: -1 }, limit: 3 }
        )
        .toArray();
      orders.push(...recent);
    }

    if (orders.length === 0) {
      return {
        context:
          'No order information could be found. The user may need to provide their order ID, or may not be logged in.',
        sources: [],
      };
    }

    const lines = ['Order information:'];
    const sources: string[] = [];

    for (const o of orders) {
      const items = Array.isArray(o.items)
        ? (o.items as Array<{ name?: string; quantity?: number }>)
            .map((i) => `${i.name ?? 'Item'} (x${i.quantity ?? 1})`)
            .join(', ')
        : 'N/A';

      lines.push(
        `- Order ID: ${o._id} | Status: ${o.status} | Total: ₹${o.totalAmount ?? o.total ?? 'N/A'} | Items: ${items} | Placed: ${o.createdAt ? new Date(o.createdAt as string).toLocaleDateString('en-IN') : 'N/A'}`
      );
      sources.push(`order:${o._id}`);
    }

    return { context: lines.join('\n'), sources };
  } catch (err) {
    console.error('[Chatbot] Order context error:', err);
    return { context: '', sources: [] };
  }
}

function buildPolicyContext(message: string): { context: string; sources: string[] } {
  const docs = findRelevantPolicies(message, 3);
  if (docs.length === 0) return { context: '', sources: [] };

  const lines: string[] = [];
  const sources: string[] = [];

  for (const doc of docs) {
    lines.push(`[${doc.title}]\n${doc.content}`);
    sources.push(`policy:${doc.id}`);
  }

  return { context: lines.join('\n\n'), sources };
}

// ---------------------------------------------------------------------------
// Main RAG Function
// ---------------------------------------------------------------------------

export async function runRagPipeline(
  message: string,
  history: ChatTurn[],
  userId: string | null
): Promise<RagResult> {
  const intent = classifyIntent(message);

  let context = '';
  let sources: string[] = [];

  if (intent === 'product_query') {
    const r = await buildProductContext(message);
    context = r.context;
    sources = r.sources;
  } else if (intent === 'order_tracking') {
    const r = await buildOrderContext(message, userId);
    context = r.context;
    sources = r.sources;
  } else if (intent === 'policy_question') {
    const r = buildPolicyContext(message);
    context = r.context;
    sources = r.sources;
  } else {
    // For general, try a light policy lookup in case it's relevant
    const r = buildPolicyContext(message);
    context = r.context;
    sources = r.sources;
  }

  // Build the message array for OpenRouter
  const messages: OpenRouterMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Add conversation history (last 6 turns)
  const recentHistory = history.slice(-6);
  for (const turn of recentHistory) {
    messages.push({ role: turn.role === 'user' ? 'user' : 'assistant', content: turn.content });
  }

  // Add current user message with context
  const userContent = context
    ? `Context:\n${context}\n\nUser message: ${message}`
    : message;

  messages.push({ role: 'user', content: userContent });

  try {
    const response = await chat(messages, {
      model: 'meta-llama/llama-3.1-8b-instruct',
      temperature: 0.4,
      max_tokens: 512,
    });

    return { response, intent, sources };
  } catch (err) {
    console.error('[Chatbot] OpenRouter error:', err);
    return {
      response:
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact our support team at support@deligo.live.",
      intent,
      sources: [],
    };
  }
}
