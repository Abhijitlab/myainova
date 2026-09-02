export type ThemeMode = "dark" | "light";
export type ModelId = "standard" | "fast" | "agent";
export type ApiProvider = "openai" | "gemini";

export type AppSettings = {
  theme: ThemeMode;
  model: ModelId;
  mockMode: boolean;
  provider: ApiProvider;
  apiKey: string;
  displayName: string;
};

export const MODEL_OPTIONS: { id: ModelId; label: string; hint: string }[] = [
  { id: "standard", label: "Standard Reasoning", hint: "Balanced depth and speed" },
  { id: "fast", label: "Fast Response", hint: "Short, quick answers" },
  { id: "agent", label: "Agent Mode", hint: "Step-by-step planning" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  model: "standard",
  mockMode: false,
  provider: "openai",
  apiKey: "",
  displayName: "You",
};

const SETTINGS_KEY = "nova-settings-v1";

const isBrowser = () => typeof window !== "undefined";

export function loadSettings(): AppSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable — settings stay in memory for this session
  }
}
