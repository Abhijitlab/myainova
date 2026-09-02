import type { UIMessage } from "ai";

export function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

export function toMarkdown(title: string, messages: UIMessage[]) {
  const body = messages
    .map((message) => `## ${message.role === "user" ? "You" : "Nova"}\n\n${messageText(message)}`)
    .join("\n\n");
  return `# ${title}\n\n${body}\n`;
}

export function downloadMarkdown(title: string, messages: UIMessage[]) {
  const blob = new Blob([toMarkdown(title, messages)], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^\w\- ]+/g, "").trim() || "nova-chat"}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
