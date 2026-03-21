"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AppSettings {
  openRouterApiKey: string;
  aiModel: string;
  accentHue: number;
  fontSize: "sm" | "base" | "lg";
}

const defaultSettings: AppSettings = {
  openRouterApiKey: "",
  aiModel: "google/gemini-2.0-flash-001",
  accentHue: 265,
  fontSize: "base",
};

const STORAGE_KEY = "scholrtutor-settings";

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const FONT_SIZE_MAP = { sm: "14px", base: "16px", lg: "18px" } as const;

function applySettings(settings: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Accent color — override primary and sidebar-primary with the hue
  const h = settings.accentHue;
  root.style.setProperty("--primary", `oklch(0.55 0.2 ${h})`);
  root.style.setProperty("--primary-foreground", `oklch(0.985 0 0)`);
  root.style.setProperty("--sidebar-primary", `oklch(0.55 0.2 ${h})`);
  root.style.setProperty("--sidebar-primary-foreground", `oklch(0.985 0 0)`);
  root.style.setProperty("--ring", `oklch(0.55 0.15 ${h})`);

  // Font size
  root.style.fontSize = FONT_SIZE_MAP[settings.fontSize];
}

type SettingsContextValue = {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettings(loaded);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        applySettings(next);
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    saveSettings(defaultSettings);
    applySettings(defaultSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
