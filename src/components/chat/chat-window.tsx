import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import {
  Check,
  Code2,
  Copy,
  Download,
  Lightbulb,
  Mail,
  Mic,
  MicOff,
  Paperclip,
  RefreshCw,
  Sparkle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import novaMark from "@/assets/nova-mark.png";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AttachmentPreview } from "@/components/chat/attachment-preview";
import { MessageImage } from "@/components/chat/image-lightbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadMarkdown, messageText } from "@/lib/export-chat";
import { MockChatTransport } from "@/lib/mock-transport";
import { MODEL_OPTIONS, type AppSettings, type ModelId } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: "Explain a concept",
    prompt: "Explain how vector databases work, with a simple analogy.",
  },
  {
    icon: Code2,
    title: "Debug code",
    prompt: "Here's a bug in my React code — help me find and fix it:",
  },
  {
    icon: Mail,
    title: "Draft an email",
    prompt: "Draft a polite follow-up email after a job interview.",
  },
  {
    icon: Sparkle,
    title: "Brainstorm ideas",
    prompt: "Brainstorm 10 product ideas for a small indie software studio.",
  },
];

type ChatWindowProps = {
  threadId: string;
  title: string;
  initialMessages: UIMessage[];
  settings: AppSettings;
  onMessagesChange: (threadId: string, messages: UIMessage[]) => void;
  onModelChange: (model: ModelId) => void;
};

export function ChatWindow({
  threadId,
  title,
  initialMessages,
  settings,
  onMessagesChange,
  onModelChange,
}: ChatWindowProps) {
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const transport = useMemo(
    () =>
      settings.mockMode
        ? new MockChatTransport()
        : new DefaultChatTransport({
            api: "/api/chat",
            body: {
              model: settings.model,
              provider: settings.provider,
              apiKey: settings.apiKey || undefined,
            },
          }),
    [settings.mockMode, settings.model, settings.provider, settings.apiKey],
  );

  const { messages, sendMessage, regenerate, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const showThinking = status === "submitted" || (isBusy && lastMessage?.role === "user");

  useEffect(() => {
    if (status === "ready" || status === "error") {
      onMessagesChange(threadId, messages);
    }
  }, [messages, status, threadId, onMessagesChange]);

  const submit = useCallback(
    (text: string, files: FileUIPart[] = []) => {
      const trimmed = text.trim();
      if ((!trimmed && files.length === 0) || isBusy) return;
      return sendMessage({ text: trimmed, files });
    },
    [isBusy, sendMessage],
  );

  const copyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      // clipboard blocked — nothing else to do
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Select value={settings.model} onValueChange={(value) => onModelChange(value as ModelId)}>
          <SelectTrigger className="h-9 w-[210px] border-border" aria-label="Model">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span className="flex flex-col items-start">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {settings.mockMode ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            Mock mode
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto gap-2"
          disabled={messages.length === 0}
          onClick={() => downloadMarkdown(title, messages)}
        >
          <Download className="size-4" />
          Export
        </Button>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-6 pt-[10vh] text-center">
              <img src={novaMark} alt="Nova" width={512} height={512} className="size-14" />
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">What can I help with?</h1>
                <p className="text-sm text-muted-foreground">
                  Ask anything — Nova answers in markdown and remembers this chat.
                </p>
              </div>
              <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => submit(suggestion.prompt)}
                    className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-ring hover:shadow-[0_0_0_3px_var(--ring)]/10"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <suggestion.icon className="size-4 text-primary" />
                      {suggestion.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {suggestion.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, messageIndex) => {
              const text = messageText(message);
              const isLastAssistant =
                message.role === "assistant" && messageIndex === messages.length - 1;

              return (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <MessageResponse key={`${message.id}-${index}`}>
                          {part.text}
                        </MessageResponse>
                      ) : part.type === "file" && part.mediaType.startsWith("image/") ? (
                        <MessageImage
                          key={`${message.id}-${index}`}
                          src={part.url}
                          alt={part.filename ?? "Uploaded image"}
                        />
                      ) : null,
                    )}
                  </MessageContent>

                  {message.role === "assistant" && !isBusy ? (
                    <MessageActions className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <MessageAction
                        tooltip="Copy text"
                        onClick={() => void copyMessage(message.id, text)}
                      >
                        {copiedId === message.id ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </MessageAction>
                      {isLastAssistant ? (
                        <MessageAction
                          tooltip="Regenerate response"
                          onClick={() => void regenerate()}
                        >
                          <RefreshCw className="size-4" />
                        </MessageAction>
                      ) : null}
                      <MessageAction
                        tooltip="Good response"
                        className={cn(feedback[message.id] === "up" && "text-primary")}
                        onClick={() =>
                          setFeedback((current) => ({ ...current, [message.id]: "up" }))
                        }
                      >
                        <ThumbsUp className="size-4" />
                      </MessageAction>
                      <MessageAction
                        tooltip="Bad response"
                        className={cn(feedback[message.id] === "down" && "text-destructive")}
                        onClick={() =>
                          setFeedback((current) => ({ ...current, [message.id]: "down" }))
                        }
                      >
                        <ThumbsDown className="size-4" />
                      </MessageAction>
                    </MessageActions>
                  ) : null}
                </Message>
              );
            })
          )}

          {showThinking ? (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error.message || "Something went wrong. Please try again."}
            </div>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        <PromptInputProvider>
          <PromptInput
            accept="image/png,image/jpeg,image/webp"
            multiple
            maxFiles={4}
            maxFileSize={8 * 1024 * 1024}
            globalDrop
            onSubmit={(message) => submit(message.text, message.files)}
          >
            <PromptInputHeader className="block px-3 pt-3 empty:hidden">
              <AttachmentPreview />
            </PromptInputHeader>
            <PromptInputTextarea placeholder="Message Nova…  (Enter to send, Shift+Enter for a new line)" />
            <PromptInputFooter>
              <PromptInputTools>
                <ImageUploadButton disabled={isBusy} />
                <VoiceInputButton disabled={isBusy} />
              </PromptInputTools>

              <PromptInputSubmit size="icon-sm" status={status} onStop={() => void stop()} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Nova can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}

function ImageUploadButton({ disabled }: { disabled: boolean }) {
  const attachments = usePromptInputAttachments();

  return (
    <PromptInputButton
      disabled={disabled}
      aria-label="Attach images"
      title="Attach images"
      onClick={() => attachments.openFileDialog()}
    >
      <Paperclip className="size-4" />
    </PromptInputButton>
  );
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
};

function VoiceInputButton({ disabled }: { disabled: boolean }) {
  const controller = usePromptInputController();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const globalWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
    setSupported(Boolean(Recognition));
  }, []);

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const globalWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length }, (_, index) => {
        const alternative = event.results[index]?.[0];
        return alternative ? alternative.transcript : "";
      })
        .join(" ")
        .trim();
      if (transcript) {
        const current = controller.textInput.value;
        controller.textInput.setInput(current ? `${current} ${transcript}` : transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      disabled={disabled || !supported}
      aria-pressed={listening}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      title={supported ? "Voice input" : "Voice input is not supported in this browser"}
      onClick={toggle}
      className={cn(listening && "text-primary")}
    >
      {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
    </Button>
  );
}
