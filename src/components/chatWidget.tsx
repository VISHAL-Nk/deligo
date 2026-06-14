"use client";

/**
 * ChatWidget
 *
 * Injects the Deligo floating chat widget into any page that renders it.
 * Place this in the customer layout so it appears on all customer-facing pages.
 *
 * The widget JS is served by the FastAPI chatbot server as a static file at
 *   <CHATBOT_URL>/widget/chatbot-widget.js
 *
 * If a user is logged in via NextAuth, their MongoDB `_id` is written to
 *   window.DELIGO_CHAT_USER_ID
 * so the chatbot can perform personalised order look-ups.
 */

import Script from "next/script";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const CHATBOT_URL =
  process.env.NEXT_PUBLIC_CHATBOT_URL || "http://localhost:8005";

export default function ChatWidget() {
  const { data: session } = useSession();

  // Keep window.DELIGO_CHAT_USER_ID in sync with the NextAuth session so the
  // widget can send the user's ID on every message.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userId =
      // NextAuth exposes the user id through a custom `id` field that is
      // typically added in the callbacks (session.user.id).
      // Fall back to email as a secondary identifier if id is absent.
      (session?.user as { id?: string } | undefined)?.id ||
      session?.user?.email ||
      null;

    if (userId) {
      window.DELIGO_CHAT_USER_ID = userId;
    } else {
      // Clear it when the user signs out so the widget goes back to guest mode.
      delete window.DELIGO_CHAT_USER_ID;
    }
  }, [session]);

  return (
    <Script
      id="deligo-chat-widget"
      src={`${CHATBOT_URL}/widget/chatbot-widget.js`}
      data-api-base={CHATBOT_URL}
      strategy="lazyOnload"
    />
  );
}
