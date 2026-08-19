import { createFileRoute, redirect } from "@tanstack/react-router";
import { createThreadId, loadThreads } from "@/lib/chat-store";

export const Route = createFileRoute("/")({
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
  component: RedirectFallback,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const threads = loadThreads();
    const threadId = threads[0]?.id ?? createThreadId();
    throw redirect({ to: "/c/$threadId", params: { threadId } });
  },
});

function RedirectFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Opening Nova…</p>
    </div>
  );
}
