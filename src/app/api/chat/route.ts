/**
 * /api/chat — Deligo RAG Chatbot API Route
 *
 * Replaces the external Python Chatbot-server for Vercel deployment.
 * All logic runs inside this serverless function:
 *   - Intent classification
 *   - Context retrieval (MongoDB products/orders + static policy store)
 *   - Response generation via OpenRouter (Llama 3.1 8B)
 *
 * POST /api/chat
 * Body: { session_id: string, message: string, user_id?: string, history?: ChatTurn[] }
 *
 * POST /api/chat/clear — Clear session (no-op in stateless serverless, kept for API compat)
 */

import { NextRequest, NextResponse } from 'next/server';
import { runRagPipeline, type ChatTurn } from '@/lib/chatbot/rag';

// Rate limiting is handled via Upstash in middleware; this is the raw handler.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { message, user_id, history } = body as {
      message?: string;
      user_id?: string;
      history?: ChatTurn[];
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required', response: '', intent: null, sources: [] },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 1000 characters)', response: '', intent: null, sources: [] },
        { status: 400 }
      );
    }

    const conversationHistory: ChatTurn[] = Array.isArray(history) ? history : [];

    const result = await runRagPipeline(
      message.trim(),
      conversationHistory,
      user_id ?? null
    );

    return NextResponse.json({
      success: true,
      response: result.response,
      intent: result.intent,
      sources: result.sources,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[/api/chat] Unhandled error:', error);
    return NextResponse.json(
      {
        success: false,
        response:
          "I'm sorry, something went wrong. Please try again or contact support@deligo.live.",
        intent: null,
        sources: [],
        timestamp: new Date().toISOString(),
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Health check for the chatbot service
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'deligo-chatbot',
    mode: 'serverless',
    timestamp: new Date().toISOString(),
  });
}
