declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css?*' {
  const content: Record<string, string>;
  export default content;
}

// Deligo chatbot widget global — set by ChatWidget component so the widget
// script can include the user's ID in every chat request.
interface Window {
  DELIGO_CHAT_USER_ID?: string;
}
