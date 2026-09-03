import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

const BASE_PROMPT = [
  "You are a helpful, direct AI assistant.",
  "Answer clearly. Use markdown for structure: headings, lists, tables, and fenced code blocks with a language tag.",
  "If you are unsure about something, say so instead of inventing details.",
].join(" ");

const MODE_PROMPT: Record<string, string> = {
  standard: "Give balanced answers with enough depth to be genuinely useful.",
  fast: "Be brief. Prefer short answers of a few sentences or a tight list.",
  agent:
    "Work step by step: restate the goal, lay out a numbered plan, then execute each step and finish with a short summary.",
};

const MODE_EFFORT: Record<string, "low" | "medium" | "high"> = {
  standard: "medium",
  fast: "low",
  agent: "high",
};

type ChatRequestBody = {
  messages?: unknown;
  model?: string;
  provider?: "openai" | "gemini";
  apiKey?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const { messages } = body;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const mode = body.model && MODE_PROMPT[body.model] ? body.model : "standard";
        const system = `${BASE_PROMPT} ${MODE_PROMPT[mode]}`;
        const userKey = body.apiKey?.trim();

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

        try {
          let result;

          if (userKey) {
            // Bring-your-own key: talk to the user's provider directly.
            if (body.provider === "gemini") {
              const gemini = createOpenAICompatible({
                name: "gemini",
                baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
                apiKey: userKey,
              });
              result = streamText({
                model: gemini("gemini-2.5-flash"),
                system,
                messages: await convertToModelMessages(messages as UIMessage[]),
                abortSignal: request.signal,
              });
            } else {
              const openai = createOpenAI({ apiKey: userKey });
              result = streamText({
                model: openai.responses("gpt-5.1"),
                system,
                messages: await convertToModelMessages(messages as UIMessage[]),
                abortSignal: request.signal,
                providerOptions: { openai: { store: false } },
              });
            }
          } else {
            const apiKey = process.env["LOVABLE_API_KEY"];
            if (!apiKey) {
              return new Response("AI is not configured for this app.", { status: 500 });
            }
            const lovable = createOpenAI({
              baseURL: "https://ai.gateway.lovable.dev/v1",
              apiKey,
              headers: {
                "Lovable-API-Key": apiKey,
                "X-Lovable-AIG-SDK": "vercel-ai-sdk",
              },
              fetch: runIdFetch.fetch,
            });
            result = streamText({
              model: lovable.responses("openai/gpt-5.6-sol"),
              system,
              messages: await convertToModelMessages(messages as UIMessage[]),
              abortSignal: request.signal,
              providerOptions: {
                openai: {
                  store: false,
                  forceReasoning: true,
                  reasoningEffort: MODE_EFFORT[mode],
                  reasoningSummary: "auto",
                  include: ["reasoning.encrypted_content"],
                },
              },
            });
          }


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
