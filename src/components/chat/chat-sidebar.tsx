import { Link, useNavigate } from "@tanstack/react-router";
import { Check, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import novaMark from "@/assets/nova-mark.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createThreadId, type ChatThread } from "@/lib/chat-store";

type ChatSidebarProps = {
  threads: ChatThread[];
  activeThreadId: string;
  onRename: (threadId: string, title: string) => void;
  onDelete: (threadId: string) => void;
};

export function ChatSidebar({
  threads,
  activeThreadId,
  onRename,
  onDelete,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const startNewChat = () => {
    navigate({ to: "/c/$threadId", params: { threadId: createThreadId() } });
  };

  const handleDelete = (threadId: string) => {
    onDelete(threadId);
    if (threadId === activeThreadId) {
      const next = threads.find((thread) => thread.id !== threadId);
      navigate({
        to: "/c/$threadId",
        params: { threadId: next?.id ?? createThreadId() },
      });
    }
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-4">
        <img
          src={novaMark}
          alt="Nova logo"
          width={512}
          height={512}
          className="size-7 rounded-md"
        />
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Nova
        </span>
      </div>

      <div className="px-3 pb-3">
        <Button
          onClick={startNewChat}
          variant="secondary"
          className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;
          const isEditing = editingId === thread.id;

          return (
            <div
              key={thread.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onRename(thread.id, draftTitle);
                        setEditingId(null);
                      }
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    className="min-w-0 flex-1 rounded-md bg-background px-2 py-1 text-sm text-foreground outline-none ring-1 ring-ring"
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Save title"
                    onClick={() => {
                      onRename(thread.id, draftTitle);
                      setEditingId(null);
                    }}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Cancel rename"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/c/$threadId"
                    params={{ threadId: thread.id }}
                    className="flex min-w-0 flex-1 items-center gap-2 truncate py-0.5"
                  >
                    <MessageSquare className="size-4 shrink-0 opacity-70" />
                    <span className="truncate">{thread.title}</span>
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Rename ${thread.title}`}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => {
                      setEditingId(thread.id);
                      setDraftTitle(thread.title);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete ${thread.title}`}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(thread.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </nav>

      <p className="border-t border-sidebar-border px-4 py-3 text-xs text-muted-foreground">
        Chats are stored only in this browser.
      </p>
    </aside>
  );
}
