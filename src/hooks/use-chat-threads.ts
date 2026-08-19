import { useCallback, useState } from "react";
import type { UIMessage } from "ai";
import {
  createThread,
  isBrowser,
  loadThreads,
  saveThreads,
  titleFromMessages,
  type ChatThread,
} from "@/lib/chat-store";

/**
 * Idempotent, client-safe bootstrap: reads localStorage once during the first
 * render on the client and creates the default thread in the same pass, so
 * StrictMode double-effects can never produce duplicate blank threads.
 */
function bootstrap(activeThreadId: string): ChatThread[] {
  if (!isBrowser()) return [createThread(activeThreadId)];
  const stored = loadThreads();
  if (stored.some((thread) => thread.id === activeThreadId)) return stored;
  const next = [createThread(activeThreadId), ...stored];
  saveThreads(next);
  return next;
}

export function useChatThreads(activeThreadId: string) {
  const [threads, setThreads] = useState<ChatThread[]>(() => bootstrap(activeThreadId));

  const commit = useCallback((updater: (current: ChatThread[]) => ChatThread[]) => {
    setThreads((current) => {
      const next = updater(current).sort((a, b) => b.updatedAt - a.updatedAt);
      saveThreads(next);
      return next;
    });
  }, []);

  const ensureThread = useCallback(
    (threadId: string) => {
      commit((current) =>
        current.some((thread) => thread.id === threadId)
          ? current
          : [createThread(threadId), ...current],
      );
    },
    [commit],
  );

  const persistMessages = useCallback(
    (threadId: string, messages: UIMessage[]) => {
      commit((current) =>
        current.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                messages,
                updatedAt: Date.now(),
                title:
                  thread.title === "New chat" ? titleFromMessages(messages) : thread.title,
              }
            : thread,
        ),
      );
    },
    [commit],
  );

  const renameThread = useCallback(
    (threadId: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      commit((current) =>
        current.map((thread) =>
          thread.id === threadId ? { ...thread, title: trimmed } : thread,
        ),
      );
    },
    [commit],
  );

  const deleteThread = useCallback(
    (threadId: string) => {
      commit((current) => current.filter((thread) => thread.id !== threadId));
    },
    [commit],
  );

  return { threads, ensureThread, persistMessages, renameThread, deleteThread };
}
