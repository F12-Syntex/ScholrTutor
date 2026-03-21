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
  // AI
  openRouterApiKey: string;
  aiModel: string;

  // Appearance
  accentHue: number;
  fontSize: "sm" | "base" | "lg";
  borderRadius: number; // 0-16 px
  sidebarWidth: number; // 200-320 px
  contentPanelGap: number; // 0-12 px
  panelRadius: number; // 0-20 px
}

const defaultSettings: AppSettings = {
  openRouterApiKey: "",
  aiModel: "google/gemini-2.5-flash-lite",
  accentHue: 265,
  fontSize: "base",
  borderRadius: 10,
  sidebarWidth: 256,
  contentPanelGap: 8,
  panelRadius: 12,
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

  const h = settings.accentHue;
  root.style.setProperty("--primary", `oklch(0.55 0.2 ${h})`);
  root.style.setProperty("--primary-foreground", `oklch(0.985 0 0)`);
  root.style.setProperty("--sidebar-primary", `oklch(0.55 0.2 ${h})`);
  root.style.setProperty("--sidebar-primary-foreground", `oklch(0.985 0 0)`);
  root.style.setProperty("--ring", `oklch(0.55 0.15 ${h})`);

  root.style.fontSize = FONT_SIZE_MAP[settings.fontSize];
  root.style.setProperty("--radius", `${settings.borderRadius / 16}rem`);
  root.style.setProperty("--sidebar-width", `${settings.sidebarWidth}px`);
  root.style.setProperty("--panel-gap", `${settings.contentPanelGap}px`);
  root.style.setProperty("--panel-radius", `${settings.panelRadius}px`);
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

export { defaultSettings };
