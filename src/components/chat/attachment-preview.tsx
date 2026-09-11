import { X } from "lucide-react";
import { useProviderAttachments } from "@/components/ai-elements/prompt-input";

/** Thumbnail strip shown above the composer for pending image attachments. */
export function AttachmentPreview() {
  const attachments = useProviderAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Pending attachments">
      {attachments.files.map((file) => (
        <div
          key={file.id}
          className="group relative size-16 overflow-hidden rounded-md border border-border bg-muted"
        >
          <img
            src={file.url}
            alt={file.filename ?? "Attached image"}
            className="size-full object-cover"
          />
          <button
            type="button"
            aria-label={`Remove ${file.filename ?? "image"}`}
            onClick={() => attachments.remove(file.id)}
            className="absolute right-0.5 top-0.5 rounded-full bg-background/85 p-0.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
