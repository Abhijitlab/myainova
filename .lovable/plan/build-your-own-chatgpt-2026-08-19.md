# Build your own ChatGPT

A dark, ChatGPT-style AI chat app with multiple conversation threads saved in your browser. No login, no database — everything stays on your device.

## What you get

- **Sidebar with chat history** — list of past conversations, "New chat" button, rename/delete a thread.
- **Each chat has its own URL** — reloading a chat brings back exactly that conversation.
- **Streaming replies** — answers appear word by word, with a "Thinking…" indicator before the first token and a stop button while generating.
- **Markdown-formatted answers** — headings, lists, code blocks with copy buttons.
- **Auto-titled chats** — the thread name comes from your first message.
- **Dark ChatGPT-like look** — neutral dark surfaces, no assistant bubble, subtle user bubble, roomy message column, focused composer at the bottom.
- **Clear errors** — rate limit / credit / network failures show a readable message instead of a silent blank reply.

Text chat only for now; image upload and image generation are left out.

## Technical notes

- Streaming endpoint: TanStack server route `src/routes/api/chat.ts` calling the Lovable AI Gateway Responses API with `openai/gpt-5.6-sol` (streaming, `store: false`, reasoning options omitted since thinking isn't displayed). `LOVABLE_API_KEY` stays server-side.
- Client: `useChat` from `@ai-sdk/react` with `DefaultChatTransport` pointed at `/api/chat`, chat keyed by thread id, rendering `message.parts`.
- Routing: `src/routes/index.tsx` creates/selects a thread and redirects to `src/routes/c.$threadId.tsx`; the thread id from the route param is the single source of truth.
- Storage: one localStorage key holding `{ id, title, updatedAt, messages }[]`, read through an idempotent client-safe bootstrap (no first-thread creation in `useEffect`), persisted on stream completion.
- UI built from AI Elements primitives (`conversation`, `message`, `prompt-input`, `shimmer`) installed via the shadcn CLI, with a custom dark theme in `src/styles.css` and a custom sidebar.
- Per-route `head()` metadata with an app-specific title/description.
