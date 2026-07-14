/**
 * /api/chat/clear — Clear chat session (Vercel serverless compat)
 *
 * The Python chatbot server kept in-memory sessions that could be cleared.
 * In the stateless Vercel serverless implementation, sessions live in the
 * client (history passed per-request), so "clearing" is a no-op.
 * This endpoint exists purely for API compatibility with any clients that
 * call POST /chat/clear.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    cleared: true,
    timestamp: new Date().toISOString(),
    message: 'Session cleared (client should discard conversation history)',
  });
}
