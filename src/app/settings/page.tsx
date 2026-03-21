"use client";

import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { useState } from "react";
import { Input } from "@/components/ui/input";

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/50 my-6" />;
}

const AI_MODELS = [
  {
    value: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash",
    desc: "Fast, cost-effective",
  },
  {
    value: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    desc: "Balanced quality",
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    desc: "Lightweight, cheap",
  },
];

const ACCENT_PRESETS = [
  { hue: 265, label: "Indigo" },
  { hue: 220, label: "Blue" },
  { hue: 150, label: "Green" },
  { hue: 340, label: "Rose" },
  { hue: 25, label: "Orange" },
  { hue: 280, label: "Purple" },
  { hue: 180, label: "Teal" },
];

function ThemePreviewCard({
  mode,
  isActive,
  onClick,
}: {
  mode: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const isDark = mode === "dark";
  const isSystem = mode === "system";
  const bg = isDark ? "#111116" : isSystem ? "#111116" : "#f5f5f3";
  const sidebar = isDark ? "#0a0a0e" : isSystem ? "#0a0a0e" : "#eaeae8";
  const line = isDark ? "#222228" : isSystem ? "#222228" : "#d8d8d6";
  const text = isDark ? "#555" : isSystem ? "#555" : "#bbb";
  const panel = isDark ? "#1a1a1f" : isSystem ? "#1a1a1f" : "#fff";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group`}
    >
      <div
        className={`w-[140px] h-[90px] rounded-lg overflow-hidden border-2 transition-colors ${
          isActive ? "border-primary" : "border-border/50 group-hover:border-border"
        }`}
        style={{ backgroundColor: bg }}
      >
        <div className="flex h-full">
          {/* Mini sidebar */}
          <div
            className="w-8 h-full flex flex-col gap-1 p-1.5"
            style={{ backgroundColor: sidebar }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 rounded-full"
                style={{ backgroundColor: line, width: i === 1 ? "100%" : "80%" }}
              />
            ))}
          </div>
          {/* Mini content */}
          <div className="flex-1 p-2 flex flex-col gap-1.5" style={{ margin: 3, borderRadius: 4, backgroundColor: panel }}>
            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: text }} />
            <div className="h-1 w-16 rounded-full" style={{ backgroundColor: line }} />
            <div className="flex-1 rounded" style={{ backgroundColor: line, opacity: 0.5 }} />
          </div>
        </div>
      </div>
      <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
        {mode.charAt(0).toUpperCase() + mode.slice(1)}
        {isSystem && " preference"}
      </span>
    </button>
  );
}

function ApiKeySection() {
  const { settings, updateSetting } = useSettings();
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="OpenRouter API Key"
        description="Required for AI-powered summaries and parsing."
      />
      <div className="relative max-w-md">
        <Input
          type={visible ? "text" : "password"}
          value={settings.openRouterApiKey}
          onChange={(e) => updateSetting("openRouterApiKey", e.target.value)}
          placeholder="sk-or-v1-..."
          className="pr-10 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {visible ? <EyeSlash size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function ModelSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-4">
      <SectionHeader
        title="AI Model"
        description="Model used for generating summaries and parsing assistance."
      />
      <div className="grid gap-2 max-w-md">
        {AI_MODELS.map((m) => {
          const selected = settings.aiModel === m.value;
          return (
            <button
              key={m.value}
              onClick={() => updateSetting("aiModel", m.value)}
              className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border hover:bg-accent/30"
              }`}
            >
              <div
                className={`flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 ${
                  selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}
              >
                {selected && (
                  <Check size={10} className="text-primary-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Interface theme"
        description="Select or customise your UI theme."
      />
      <div className="flex gap-4">
        {(["system", "light", "dark"] as const).map((t) => (
          <ThemePreviewCard
            key={t}
            mode={t}
            isActive={theme === t}
            onClick={() => setTheme(t)}
          />
        ))}
      </div>
    </div>
  );
}

function AccentSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Accent colour"
        description="Used for primary buttons, active states, and focus rings."
      />
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((preset) => {
            const selected = settings.accentHue === preset.hue;
            return (
              <button
                key={preset.hue}
                onClick={() => updateSetting("accentHue", preset.hue)}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selected
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: `oklch(0.55 0.2 ${preset.hue})` }}
                />
                <span className={selected ? "text-foreground" : "text-muted-foreground"}>
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 max-w-sm">
          <span className="text-xs text-muted-foreground shrink-0">Custom</span>
          <input
            type="range"
            min="0"
            max="360"
            value={settings.accentHue}
            onChange={(e) => updateSetting("accentHue", Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right,
                oklch(0.55 0.2 0), oklch(0.55 0.2 60), oklch(0.55 0.2 120),
                oklch(0.55 0.2 180), oklch(0.55 0.2 240), oklch(0.55 0.2 300), oklch(0.55 0.2 360))`,
            }}
          />
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">
            {settings.accentHue}°
          </span>
        </div>
      </div>
    </div>
  );
}

function FontSizeSection() {
  const { settings, updateSetting } = useSettings();
  const sizes = [
    { value: "sm" as const, label: "Small", preview: "Aa" },
    { value: "base" as const, label: "Default", preview: "Aa" },
    { value: "lg" as const, label: "Large", preview: "Aa" },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Font size"
        description="Scales the entire interface."
      />
      <div className="flex gap-3">
        {sizes.map((s) => {
          const selected = settings.fontSize === s.value;
          const textSize = s.value === "sm" ? "text-xs" : s.value === "lg" ? "text-lg" : "text-sm";
          return (
            <button
              key={s.value}
              onClick={() => updateSetting("fontSize", s.value)}
              className={`flex flex-col items-center gap-1.5 w-20 py-3 rounded-lg border transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border hover:bg-accent/30"
              }`}
            >
              <span className={`font-semibold ${textSize}`}>{s.preview}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DataSection() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Data & storage"
        description="Your data is stored locally on this device."
      />
      <div className="space-y-2 max-w-md">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-muted-foreground">Database</span>
          <span className="text-xs font-mono text-muted-foreground/60">
            %APPDATA%/ScholrTutor/scholrtutor.db
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-muted-foreground">Files</span>
          <span className="text-xs font-mono text-muted-foreground/60">
            %APPDATA%/ScholrTutor/files/
          </span>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <SectionHeader title="About" />
      <div className="space-y-1 max-w-md">
        {[
          ["Version", "0.9.4"],
          ["Electron", "41.x"],
          ["Next.js", "15.x"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-xs font-mono text-muted-foreground/60">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure your ScholrTutor experience.
      </p>

      <div className="mt-8 space-y-0">
        <ApiKeySection />
        <Divider />
        <ModelSection />
        <Divider />
        <ThemeSection />
        <Divider />
        <AccentSection />
        <Divider />
        <FontSizeSection />
        <Divider />
        <DataSection />
        <Divider />
        <AboutSection />
      </div>
    </div>
  );
}
