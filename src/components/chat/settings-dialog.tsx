import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AppSettings, ApiProvider } from "@/lib/settings-store";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
};

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onUpdate,
}: SettingsDialogProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Everything here is stored only in this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={settings.displayName}
              onChange={(event) => onUpdate({ displayName: event.target.value })}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="mock-mode">Mock AI responses</Label>
              <p className="text-xs text-muted-foreground">
                Simulate streaming replies without calling a model.
              </p>
            </div>
            <Switch
              id="mock-mode"
              checked={settings.mockMode}
              onCheckedChange={(checked) => onUpdate({ mockMode: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">API provider</Label>
            <Select
              value={settings.provider}
              onValueChange={(value) => onUpdate({ provider: value as ApiProvider })}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API key (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                placeholder="Leave empty to use the built-in assistant"
                value={settings.apiKey}
                onChange={(event) => onUpdate({ apiKey: event.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showKey ? "Hide API key" : "Show API key"}
                onClick={() => setShowKey((current) => !current)}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Saved in local storage on this device and sent only to your chosen
              provider.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
