import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import novaMark from "@/assets/nova-mark.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createThreadId, type ChatThread } from "@/lib/chat-store";
import type { ThemeMode } from "@/lib/settings-store";

type ChatSidebarProps = {
  threads: ChatThread[];
  activeThreadId: string;
  collapsed: boolean;
  theme: ThemeMode;
  displayName: string;
  onToggleCollapsed: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onRename: (threadId: string, title: string) => void;
  onDelete: (threadId: string) => void;
};

const DAY = 24 * 60 * 60 * 1000;

function groupThreads(threads: ChatThread[]) {
  const now = Date.now();
  const today: ChatThread[] = [];
  const week: ChatThread[] = [];
  const older: ChatThread[] = [];
  for (const thread of threads) {
    const age = now - thread.updatedAt;
    if (age < DAY) today.push(thread);
    else if (age < 7 * DAY) week.push(thread);
    else older.push(thread);
  }
  return [
    { label: "Today", items: today },
    { label: "Previous 7 Days", items: week },
    { label: "Older", items: older },
  ].filter((group) => group.items.length > 0);
}

export function ChatSidebar({
  threads,
  activeThreadId,
  collapsed,
  theme,
  displayName,
  onToggleCollapsed,
  onToggleTheme,
  onOpenSettings,
  onRename,
  onDelete,
}: ChatSidebarProps) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? threads.filter((thread) => thread.title.toLowerCase().includes(term))
      : threads;
    return groupThreads(filtered);
  }, [threads, query]);

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

  if (collapsed) {
    return (
      <aside
        aria-label="Chat history"
        className="flex h-full w-14 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-4"
      >
        <img src={novaMark} alt="Nova" width={512} height={512} className="size-7 rounded-md" />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Expand sidebar"
          onClick={onToggleCollapsed}
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="New chat" onClick={startNewChat}>
          <Plus className="size-4" />
        </Button>
        <div className="mt-auto flex flex-col gap-2">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Toggle theme"
            onClick={onToggleTheme}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Open settings"
            onClick={onOpenSettings}
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Chat history"
      className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all"
    >
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
        <Button
          size="icon-sm"
          variant="ghost"
          className="ml-auto"
          aria-label="Collapse sidebar"
          onClick={onToggleCollapsed}
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="space-y-2 px-3 pb-3">
        <Button
          onClick={startNewChat}
          variant="secondary"
          className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80"
        >
          <Plus className="size-4" />
          New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No conversations found.
          </p>
        ) : null}
        {groups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((thread) => {
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
                        aria-label="Conversation title"
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
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
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
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        onClick={() => handleDelete(thread.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-sidebar-border px-3 py-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/15 text-xs text-primary">
            {displayName.slice(0, 2).toUpperCase() || "YO"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-sidebar-foreground">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">Stored on this device</p>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Open settings"
          onClick={onOpenSettings}
        >
          <Settings className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
