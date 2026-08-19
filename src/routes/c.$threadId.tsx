import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { useChatThreads } from "@/hooks/use-chat-threads";

export const Route = createFileRoute("/c/$threadId")({
  head: () => ({
    meta: [
      { title: "Nova Chat — Your private AI assistant" },
      {
        name: "description",
        content:
          "Chat with Nova, a fast AI assistant with threaded conversation history saved privately in your browser.",
      },
      { property: "og:title", content: "Nova Chat — Your private AI assistant" },
      {
        property: "og:description",
        content:
          "Threaded AI chat with markdown answers and history stored only on your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const { threads, ensureThread, persistMessages, renameThread, deleteThread } =
    useChatThreads(threadId);

  useEffect(() => {
    ensureThread(threadId);
  }, [threadId, ensureThread]);

  const activeThread = threads.find((thread) => thread.id === threadId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ChatSidebar
        threads={threads}
        activeThreadId={threadId}
        onRename={renameThread}
        onDelete={deleteThread}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatWindow
          key={threadId}
          threadId={threadId}
          initialMessages={activeThread?.messages ?? []}
          onMessagesChange={persistMessages}
        />
      </main>
    </div>
  );
}
