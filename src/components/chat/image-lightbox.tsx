import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type MessageImageProps = {
  src: string;
  alt: string;
};

/** Image rendered inside a message bubble, expandable into a lightbox. */
export function MessageImage({ src, alt }: MessageImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Expand image ${alt}`}
        className="block overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
      >
        <img src={src} alt={alt} className="max-h-64 max-w-xs object-contain" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl bg-background p-2">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt} className="max-h-[80vh] w-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
