import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { SettingsDialog } from "@/components/chat/settings-dialog";
import { useChatThreads } from "@/hooks/use-chat-threads";
import { useSettings } from "@/hooks/use-settings";

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
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, update, toggleTheme } = useSettings();
  const { threads, ensureThread, persistMessages, renameThread, deleteThread } =
    useChatThreads(threadId);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    ensureThread(threadId);
  }, [threadId, ensureThread]);

  const activeThread = threads.find((thread) => thread.id === threadId);

  // Thread history lives in localStorage, so the first paint must match the
  // server-rendered shell before the stored threads are shown.
  if (!hydrated) {
    return <div className="h-screen w-full bg-background" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ChatSidebar
        threads={threads}
        activeThreadId={threadId}
        collapsed={collapsed}
        theme={settings.theme}
        displayName={settings.displayName}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onRename={renameThread}
        onDelete={deleteThread}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatWindow
          key={`${threadId}-${settings.mockMode ? "mock" : "live"}`}
          threadId={threadId}
          title={activeThread?.title ?? "New chat"}
          initialMessages={activeThread?.messages ?? []}
          settings={settings}
          onMessagesChange={persistMessages}
          onModelChange={(model) => update({ model })}
        />
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onUpdate={update}
      />
    </div>
  );
}
