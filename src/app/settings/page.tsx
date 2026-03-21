"use client";

import { useTheme } from "next-themes";
import { useSettings, defaultSettings } from "@/lib/settings";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Robot } from "@phosphor-icons/react/dist/ssr/Robot";
import { Palette } from "@phosphor-icons/react/dist/ssr/Palette";
import { Database } from "@phosphor-icons/react/dist/ssr/Database";
import { Info } from "@phosphor-icons/react/dist/ssr/Info";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Shared components ──

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4 border-b border-border/30 last:border-0">
      <div className="min-w-0 shrink-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5 max-w-[260px]">{description}</div>}
      </div>
      <div className="flex items-center shrink-0">{children}</div>
    </div>
  );
}

function SliderControl({ value, min, max, step, unit, onChange }: { value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-32 h-1.5 rounded-full appearance-none cursor-pointer bg-border"
      />
      <span className="text-xs font-mono text-muted-foreground w-12 text-right">
        {value}{unit}
      </span>
    </div>
  );
}

// ── Tab: General (AI) ──

const AI_MODELS = [
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", desc: "Fast, cost-effective" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", desc: "Balanced quality" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", desc: "Lightweight, cheap" },
];

function GeneralTab() {
  const { settings, updateSetting } = useSettings();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <SectionHeader title="AI Configuration" description="Connect to OpenRouter for AI-powered features." />

      <SettingRow label="API Key" description="Your OpenRouter API key for AI summaries.">
        <div className="relative w-56">
          <Input
            type={visible ? "text" : "password"}
            value={settings.openRouterApiKey}
            onChange={(e) => updateSetting("openRouterApiKey", e.target.value)}
            placeholder="sk-or-v1-..."
            className="pr-9 font-mono text-xs h-8"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? <EyeSlash size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </SettingRow>

      <SettingRow label="Model" description="AI model for summaries and parsing.">
        <div className="space-y-1.5">
          {AI_MODELS.map((m) => {
            const selected = settings.aiModel === m.value;
            return (
              <button
                key={m.value}
                onClick={() => updateSetting("aiModel", m.value)}
                className={`flex items-center gap-2.5 w-56 rounded-md border px-3 py-2 text-left transition-colors ${
                  selected ? "border-primary bg-primary/5" : "border-border/40 hover:border-border hover:bg-accent/30"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {selected && <Check size={8} className="text-primary-foreground" />}
                </div>
                <div>
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SettingRow>
    </div>
  );
}

// ── Tab: Appearance ──

const ACCENT_PRESETS = [
  { hue: 265, label: "Indigo" },
  { hue: 220, label: "Blue" },
  { hue: 150, label: "Green" },
  { hue: 340, label: "Rose" },
  { hue: 25, label: "Orange" },
  { hue: 280, label: "Purple" },
  { hue: 180, label: "Teal" },
  { hue: 0, label: "Red" },
  { hue: 55, label: "Yellow" },
];

function ThemePreviewCard({ mode, isActive, onClick }: { mode: string; isActive: boolean; onClick: () => void }) {
  const isDark = mode === "dark";
  const isSystem = mode === "system";
  const bg = isDark || isSystem ? "#111116" : "#f5f5f3";
  const sidebar = isDark || isSystem ? "#0a0a0e" : "#eaeae8";
  const line = isDark || isSystem ? "#222228" : "#d8d8d6";
  const text = isDark || isSystem ? "#444" : "#bbb";
  const panel = isDark || isSystem ? "#1a1a1f" : "#fff";

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <div className={`w-[120px] h-[78px] rounded-lg overflow-hidden border-2 transition-colors ${
        isActive ? "border-primary" : "border-border/40 group-hover:border-border"
      }`} style={{ backgroundColor: bg }}>
        <div className="flex h-full">
          <div className="w-7 h-full flex flex-col gap-0.5 p-1" style={{ backgroundColor: sidebar }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-0.5 rounded-full" style={{ backgroundColor: line, width: i === 1 ? "100%" : "70%" }} />
            ))}
          </div>
          <div className="flex-1 p-1.5 flex flex-col gap-1" style={{ margin: 2, borderRadius: 3, backgroundColor: panel }}>
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: text }} />
            <div className="h-0.5 w-12 rounded-full" style={{ backgroundColor: line }} />
            <div className="flex-1 rounded" style={{ backgroundColor: line, opacity: 0.4 }} />
          </div>
        </div>
      </div>
      <span className={`text-[11px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
        {mode === "system" ? "System" : mode.charAt(0).toUpperCase() + mode.slice(1)}
      </span>
    </button>
  );
}

function RadiusPreview({ radius }: { radius: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 border-2 border-primary bg-primary/10"
        style={{ borderRadius: `${radius}px` }}
      />
      <div
        className="w-14 h-6 border-2 border-muted-foreground/20 bg-muted"
        style={{ borderRadius: `${Math.min(radius, 12)}px` }}
      />
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();

  return (
    <div>
      <SectionHeader title="Appearance" description="Customise colours, typography, and layout." />

      {/* Theme */}
      <SettingRow label="Interface theme" description="Choose light, dark, or match your system.">
        <div className="flex gap-3">
          {(["system", "light", "dark"] as const).map((t) => (
            <ThemePreviewCard key={t} mode={t} isActive={theme === t} onClick={() => setTheme(t)} />
          ))}
        </div>
      </SettingRow>

      {/* Accent color */}
      <SettingRow label="Accent colour" description="Primary colour for buttons, active states, and focus rings.">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5 max-w-[240px]">
            {ACCENT_PRESETS.map((p) => {
              const sel = settings.accentHue === p.hue;
              return (
                <button
                  key={p.hue}
                  onClick={() => updateSetting("accentHue", p.hue)}
                  className={`w-7 h-7 rounded-full transition-all ${sel ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: `oklch(0.55 0.2 ${p.hue})` }}
                  title={p.label}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="360"
              value={settings.accentHue}
              onChange={(e) => updateSetting("accentHue", Number(e.target.value))}
              className="w-40 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, oklch(0.55 0.2 0), oklch(0.55 0.2 60), oklch(0.55 0.2 120), oklch(0.55 0.2 180), oklch(0.55 0.2 240), oklch(0.55 0.2 300), oklch(0.55 0.2 360))`,
              }}
            />
            <span className="text-[10px] font-mono text-muted-foreground">{settings.accentHue}°</span>
          </div>
        </div>
      </SettingRow>

      {/* Font size */}
      <SettingRow label="Font size" description="Scales the entire interface proportionally.">
        <div className="flex gap-2">
          {([
            { value: "sm" as const, label: "S", size: "text-xs" },
            { value: "base" as const, label: "M", size: "text-sm" },
            { value: "lg" as const, label: "L", size: "text-base" },
          ]).map((s) => {
            const sel = settings.fontSize === s.value;
            return (
              <button
                key={s.value}
                onClick={() => updateSetting("fontSize", s.value)}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center font-semibold transition-colors ${
                  sel ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-border hover:bg-accent/30"
                } ${s.size}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </SettingRow>

      {/* Border radius */}
      <SettingRow label="Border radius" description="Roundness of buttons, cards, and inputs.">
        <div className="flex items-center gap-4">
          <RadiusPreview radius={settings.borderRadius} />
          <SliderControl value={settings.borderRadius} min={0} max={16} unit="px" onChange={(v) => updateSetting("borderRadius", v)} />
        </div>
      </SettingRow>

      {/* Sidebar width */}
      <SettingRow label="Sidebar width" description="Width of the navigation sidebar.">
        <SliderControl value={settings.sidebarWidth} min={200} max={320} step={8} unit="px" onChange={(v) => updateSetting("sidebarWidth", v)} />
      </SettingRow>

      {/* Content panel gap */}
      <SettingRow label="Panel gap" description="Space between sidebar and content panel.">
        <SliderControl value={settings.contentPanelGap} min={0} max={12} unit="px" onChange={(v) => updateSetting("contentPanelGap", v)} />
      </SettingRow>

      {/* Panel corner radius */}
      <SettingRow label="Panel radius" description="Corner radius of the content panel.">
        <SliderControl value={settings.panelRadius} min={0} max={20} unit="px" onChange={(v) => updateSetting("panelRadius", v)} />
      </SettingRow>
    </div>
  );
}

// ── Tab: Data ──

function DataTab() {
  const { resetSettings } = useSettings();
  return (
    <div>
      <SectionHeader title="Data & Storage" description="Your data stays on this device." />

      <SettingRow label="Database" description="SQLite database file location.">
        <span className="text-[11px] font-mono text-muted-foreground/60">%APPDATA%/ScholrTutor/scholrtutor.db</span>
      </SettingRow>

      <SettingRow label="Uploaded files" description="Copied to app data on upload.">
        <span className="text-[11px] font-mono text-muted-foreground/60">%APPDATA%/ScholrTutor/files/</span>
      </SettingRow>

      <SettingRow label="Reset settings" description="Restore all settings to defaults.">
        <Button variant="ghost" size="sm" onClick={resetSettings} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <ArrowCounterClockwise size={14} className="mr-1.5" />
          Reset
        </Button>
      </SettingRow>
    </div>
  );
}

// ── Tab: About ──

function AboutTab() {
  return (
    <div>
      <SectionHeader title="About ScholrTutor" />
      <SettingRow label="Version"><span className="text-xs font-mono text-muted-foreground">1.0.0</span></SettingRow>
      <SettingRow label="Electron"><span className="text-xs font-mono text-muted-foreground">41.x</span></SettingRow>
      <SettingRow label="Next.js"><span className="text-xs font-mono text-muted-foreground">15.x</span></SettingRow>
      <SettingRow label="Font"><span className="text-xs font-mono text-muted-foreground">Geist Sans + Mono</span></SettingRow>
      <SettingRow label="Icons"><span className="text-xs font-mono text-muted-foreground">Phosphor Icons</span></SettingRow>
    </div>
  );
}

// ── Tabs + Page ──

const TABS = [
  { id: "general", label: "General", icon: Robot },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data", icon: Database },
  { id: "about", label: "About", icon: Info },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="p-8 h-full">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure your ScholrTutor experience.
      </p>

      <div className="flex gap-8 mt-8">
        {/* Left: vertical tab list */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-[13px] font-medium transition-colors text-left ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <tab.icon size={16} weight={active ? "fill" : "regular"} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: tab content */}
        <div className="flex-1 min-w-0 max-w-xl">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "data" && <DataTab />}
          {activeTab === "about" && <AboutTab />}
        </div>
      </div>
    </div>
  );
}
