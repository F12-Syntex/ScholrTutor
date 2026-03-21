"use client";

import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function ApiKeyInput() {
  const { settings, updateSetting } = useSettings();
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="api-key">OpenRouter API Key</Label>
      <div className="relative">
        <Input
          id="api-key"
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
      <p className="text-xs text-muted-foreground">
        Required for AI summaries. Get yours at{" "}
        <span className="font-medium text-foreground/70">openrouter.ai/keys</span>
      </p>
    </div>
  );
}

function ModelSelect() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-2">
      <Label>AI Model</Label>
      <div className="grid gap-2">
        {AI_MODELS.map((m) => {
          const selected = settings.aiModel === m.value;
          return (
            <button
              key={m.value}
              onClick={() => updateSetting("aiModel", m.value)}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <div
                className={`flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 ${
                  selected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {selected && <Check size={10} className="text-primary-foreground" />}
              </div>
              <div>
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
    <div className="space-y-3">
      <Label>Theme</Label>
      <div className="flex gap-2">
        {(["light", "dark", "system"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

function AccentColorSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="space-y-3">
      <Label>Accent Color</Label>
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.hue}
            onClick={() => updateSetting("accentHue", preset.hue)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              settings.accentHue === preset.hue
                ? "border-primary bg-primary/5"
                : "border-transparent hover:bg-accent"
            }`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: `oklch(0.55 0.2 ${preset.hue})` }}
            />
            <span className="text-muted-foreground">{preset.label}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Label htmlFor="custom-hue" className="text-xs text-muted-foreground shrink-0">
          Custom
        </Label>
        <input
          id="custom-hue"
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
  );
}

function FontSizeSection() {
  const { settings, updateSetting } = useSettings();
  const sizes = [
    { value: "sm" as const, label: "Small" },
    { value: "base" as const, label: "Default" },
    { value: "lg" as const, label: "Large" },
  ];

  return (
    <div className="space-y-3">
      <Label>Font Size</Label>
      <div className="flex gap-2">
        {sizes.map((s) => (
          <button
            key={s.value}
            onClick={() => updateSetting("fontSize", s.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              settings.fontSize === s.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your ScholrTutor experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Configuration</CardTitle>
          <CardDescription>
            Connect to OpenRouter for AI-powered summaries and parsing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApiKeyInput />
          <ModelSelect />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customise the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeSection />
          <AccentColorSection />
          <FontSizeSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Storage</CardTitle>
          <CardDescription>
            Your data is stored locally on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Database</Label>
            <p className="text-xs font-mono text-muted-foreground/70">
              %APPDATA%/ScholrTutor/scholrtutor.db
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">Uploaded Files</Label>
            <p className="text-xs font-mono text-muted-foreground/70">
              %APPDATA%/ScholrTutor/files/
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-mono">0.9.0</span>
          </div>
          <div className="flex justify-between">
            <span>Electron</span>
            <span className="font-mono">41.x</span>
          </div>
          <div className="flex justify-between">
            <span>Next.js</span>
            <span className="font-mono">15.x</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
