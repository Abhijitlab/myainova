import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const STORAGE_KEY = "nova-chat-threads-v1";

export const isBrowser = () => typeof window !== "undefined";

export function createThreadId() {
  if (isBrowser() && typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

export function createThread(id = createThreadId()): ChatThread {
  return { id, title: "New chat", updatedAt: Date.now(), messages: [] };
}

export function loadThreads(): ChatThread[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((thread): thread is ChatThread => {
        if (!thread || typeof thread !== "object") return false;
        const candidate = thread as Partial<ChatThread>;
        return typeof candidate.id === "string" && Array.isArray(candidate.messages);
      })
      .map((thread) => ({
        id: thread.id,
        title: thread.title || "New chat",
        updatedAt: thread.updatedAt ?? Date.now(),
        messages: thread.messages ?? [],
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // storage full or unavailable — chat keeps working in-memory
  }
}

export function titleFromMessages(messages: UIMessage[], fallback = "New chat") {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return fallback;
  const text = firstUser.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim()
    .replace(/\s+/g, " ");
  if (!text) return fallback;
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}
