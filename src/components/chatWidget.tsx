"use client";

/**
 * ChatWidget
 *
 * Renders an embedded chat widget for the Deligo platform.
 *
 * For Vercel deployment, the chatbot is handled by the Next.js API route
 * `/api/chat` instead of the external Python Chatbot-server.
 * We render the widget UI directly here to avoid the dependency on the
 * external static JS file at `<CHATBOT_URL>/widget/chatbot-widget.js`.
 *
 * If a legacy external chatbot server is still running and configured via
 * NEXT_PUBLIC_CHATBOT_URL (pointing to a non-origin URL), the original
 * Script injection is used. Otherwise we use the internal route.
 */

import Script from "next/script";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// Extend window for Deligo chat globals
declare global {
  interface Window {
    DELIGO_CHAT_USER_ID?: string;
    DELIGO_CHAT_API_BASE?: string;
  }
}

// External chatbot server URL (only set if self-hosting the Python server)
// Leave NEXT_PUBLIC_CHATBOT_URL unset in Vercel to use the internal Next.js route.
const EXTERNAL_CHATBOT_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || "";

// The internal API base always points to the same origin
const INTERNAL_API_BASE =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://deligo.live";

// Use external server only if explicitly configured to a non-origin URL
const isExternalServer =
  EXTERNAL_CHATBOT_URL &&
  !EXTERNAL_CHATBOT_URL.startsWith("/") &&
  !EXTERNAL_CHATBOT_URL.includes("deligo.live") &&
  !EXTERNAL_CHATBOT_URL.includes("localhost:3000");

const CHATBOT_API_BASE = isExternalServer
  ? EXTERNAL_CHATBOT_URL
  : INTERNAL_API_BASE;

export default function ChatWidget() {
  const { data: session } = useSession();

  // Keep window.DELIGO_CHAT_USER_ID in sync with the NextAuth session so the
  // widget can send the user's ID on every message.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userId =
      (session?.user as { id?: string } | undefined)?.id ||
      session?.user?.email ||
      null;

    if (userId) {
      window.DELIGO_CHAT_USER_ID = userId;
    } else {
      delete window.DELIGO_CHAT_USER_ID;
    }

    // Also expose the API base so external widget JS (if used) can POST to
    // the correct endpoint even after moving from localhost:8005 to the
    // Next.js API route.
    window.DELIGO_CHAT_API_BASE = CHATBOT_API_BASE;
  }, [session]);

  // If an external chatbot server widget JS is configured, inject it
  if (isExternalServer && EXTERNAL_CHATBOT_URL) {
    return (
      <Script
        id="deligo-chat-widget"
        src={`${EXTERNAL_CHATBOT_URL}/widget/chatbot-widget.js`}
        data-api-base={EXTERNAL_CHATBOT_URL}
        strategy="lazyOnload"
      />
    );
  }

  // Otherwise: the internal API route is used by the built-in chat UI
  // (rendered via the customer layout / dedicated chat component).
  // This component just makes sure the API base and user ID are set globally.
  return null;
}
