import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import novaMark from "@/assets/nova-mark.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const SUGGESTIONS = [
  "Explain quantum computing like I'm five",
  "Draft a polite follow-up email",
  "Write a Python script to rename files",
  "Plan a 3-day trip to Lisbon",
];

type ChatWindowProps = {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (threadId: string, messages: UIMessage[]) => void;
};

export function ChatWindow({
  threadId,
  initialMessages,
  onMessagesChange,
}: ChatWindowProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const showThinking = status === "submitted" || (isBusy && lastMessage?.role === "user");

  useEffect(() => {
    if (status === "ready" || status === "error") {
      onMessagesChange(threadId, messages);
    }
  }, [messages, status, threadId, onMessagesChange]);

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy, threadId]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    void sendMessage({ text: trimmed });
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-6 pt-[12vh] text-center">
              <img
                src={novaMark}
                alt="Nova"
                width={512}
                height={512}
                className="size-14"
              />
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  What can I help with?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ask anything — Nova answers in markdown and remembers this chat.
                </p>
              </div>
              <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submit(suggestion)}
                    className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${index}`}>
                        {part.text}
                      </MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {showThinking ? (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error.message || "Something went wrong. Please try again."}
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        <PromptInput
          onSubmit={(message) => {
            submit(message.text ?? "");
          }}
        >
          <PromptInputTextarea ref={textareaRef} placeholder="Message Nova…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              size="icon-sm"
              status={status}
              onClick={isBusy ? () => void stop() : undefined}
            />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Nova can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
