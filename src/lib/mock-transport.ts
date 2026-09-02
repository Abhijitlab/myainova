import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";

const OPENERS = [
  "Great question — here's how I'd think about it.",
  "Sure thing. Let me break this down.",
  "Happy to help. Here's a concise take.",
];

function mockAnswer(prompt: string) {
  const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];
  return [
    `${opener}\n`,
    `You asked: **${prompt.slice(0, 140)}**\n`,
    "### Key points",
    "- This is a simulated response from the built-in mock generator.",
    "- Streaming, markdown and code highlighting all behave like the live model.",
    "- Turn mock mode off in Settings to talk to the real assistant.\n",
    "```ts",
    "// Example snippet rendered by the markdown pipeline",
    "export function greet(name: string) {",
    '  return `Hello, ${name}!`;',
    "}",
    "```\n",
    "Anything else you'd like me to expand on?",
  ].join("\n");
}

function lastUserText(messages: UIMessage[]) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return "your message";
  return (
    lastUser.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim() || "your message"
  );
}

/**
 * Client-side transport that fakes a realistic token-by-token stream so the app
 * is fully usable without any AI credits or API key.
 */
export class MockChatTransport implements ChatTransport<UIMessage> {
  async sendMessages(options: {
    messages: UIMessage[];
    abortSignal?: AbortSignal;
  }): Promise<ReadableStream<UIMessageChunk>> {
    const text = mockAnswer(lastUserText(options.messages));
    const tokens = text.match(/\s*\S+/g) ?? [text];
    const messageId = `mock-${Date.now().toString(36)}`;
    const textId = `${messageId}-text`;
    const { abortSignal } = options;

    return new ReadableStream<UIMessageChunk>({
      async start(controller) {
        controller.enqueue({ type: "start", messageId });
        controller.enqueue({ type: "text-start", id: textId });
        for (const token of tokens) {
          if (abortSignal?.aborted) break;
          await new Promise((resolve) => setTimeout(resolve, 18 + Math.random() * 40));
          controller.enqueue({ type: "text-delta", id: textId, delta: token });
        }
        controller.enqueue({ type: "text-end", id: textId });
        controller.enqueue({ type: "finish" });
        controller.close();
      },
    });
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
