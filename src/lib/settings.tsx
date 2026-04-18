"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDebouncedPersist } from "./use-debounced-persist";

export interface AppSettings {
  openRouterApiKey: string;
  aiModel: string;
  accentHue: number;
  fontSize: "sm" | "base" | "lg";
  borderRadius: number;
  sidebarWidth: number;
  contentPanelGap: number;
  panelRadius: number;
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

const FONT_SIZE_MAP = { sm: "14px", base: "16px", lg: "18px" } as const;

/**
 * Apply settings as CSS custom properties. Runs synchronously because we
 * want visual feedback immediately; it's just a handful of property sets,
 * no layout thrash.
 */
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
    value: AppSettings[K],
  ) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettings(loaded);
    setHydrated(true);
  }, []);

  // Apply CSS on change (fast, synchronous, no layout thrash).
  useEffect(() => {
    if (hydrated) applySettings(settings);
  }, [settings, hydrated]);

  // Debounced localStorage write — keeps slider drags smooth.
  useDebouncedPersist(STORAGE_KEY, settings, hydrated);

  const updateSetting = useCallback<SettingsContextValue["updateSetting"]>(
    (key, value) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSetting, resetSettings }),
    [settings, updateSetting, resetSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
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
