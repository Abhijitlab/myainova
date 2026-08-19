import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = [
  "You are a helpful, direct AI assistant.",
  "Answer clearly and concisely. Use markdown for structure: headings, lists, tables, and fenced code blocks with a language tag.",
  "If you are unsure about something, say so instead of inventing details.",
].join(" ");

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured for this app.", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: {
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          fetch: runIdFetch.fetch,
        });

        try {
          const result = streamText({
            model: lovable.responses("openai/gpt-5.6-sol"),
            system: SYSTEM_PROMPT,
            messages: convertToModelMessages(messages as UIMessage[]),
            abortSignal: request.signal,
            providerOptions: {
              openai: {
                store: false,
              },
            },
          });

          const response = result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
            sendReasoning: false,
            onError: (error) => {
              console.error("chat stream error", error);
              const message = error instanceof Error ? error.message : String(error);
              if (message.includes("429")) {
                return "The AI is receiving too many requests right now. Please try again in a moment.";
              }
              if (message.includes("402")) {
                return "This app is out of AI credits. The owner needs to add more credits in Lovable.";
              }
              if (message.includes("403")) {
                return "AI access is currently blocked for this workspace.";
              }
              return "Something went wrong while generating the reply. Please try again.";
            },
            headers: getLovableAiGatewayResponseHeaders(undefined, {
              ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
            }),
          });

          return await withLovableAiGatewayRunIdHeader(response, runIdFetch);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return new Response("Client closed request", { status: 499 });
          }
          console.error("chat route error", error);
          return new Response("Failed to reach the AI service.", { status: 500 });
        }
      },
    },
  },
});
