"use client";

import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-border/20 last:border-0">
      <div className="min-w-0 pt-0.5">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center shrink-0">{children}</div>
    </div>
  );
}

function SliderControl({ value, min, max, step, unit, onChange }: { value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="range" min={min} max={max} step={step ?? 1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 h-1.5 rounded-full appearance-none cursor-pointer bg-border"
      />
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{value}{unit}</span>
    </div>
  );
}

// ── Theme preview ──

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
      <div className={`w-28 h-[72px] rounded-lg overflow-hidden border-2 transition-colors ${
        isActive ? "border-primary" : "border-border/40 group-hover:border-border"
      }`} style={{ backgroundColor: bg }}>
        <div className="flex h-full">
          <div className="w-6 h-full flex flex-col gap-0.5 p-1" style={{ backgroundColor: sidebar }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-0.5 rounded-full" style={{ backgroundColor: line, width: i === 1 ? "100%" : "70%" }} />
            ))}
          </div>
          <div className="flex-1 p-1 flex flex-col gap-0.5" style={{ margin: 2, borderRadius: 3, backgroundColor: panel }}>
            <div className="h-1 w-7 rounded-full" style={{ backgroundColor: text }} />
            <div className="h-0.5 w-10 rounded-full" style={{ backgroundColor: line }} />
            <div className="flex-1 rounded" style={{ backgroundColor: line, opacity: 0.3 }} />
          </div>
        </div>
      </div>
      <span className={`text-[11px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
        {mode === "system" ? "System" : mode.charAt(0).toUpperCase() + mode.slice(1)}
      </span>
    </button>
  );
}

// ── Accent presets ──

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

// ── AI models ──

const AI_MODELS = [
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", desc: "Fast, cost-effective" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", desc: "Balanced quality" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", desc: "Lightweight, cheap" },
];

// ── Tab content ──

function GeneralContent() {
  const { settings, updateSetting } = useSettings();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <SettingRow label="OpenRouter API Key" description="Required for AI summaries.">
        <div className="relative w-52">
          <Input
            type={visible ? "text" : "password"}
            value={settings.openRouterApiKey}
            onChange={(e) => updateSetting("openRouterApiKey", e.target.value)}
            placeholder="sk-or-v1-..."
            className="pr-8 font-mono text-xs h-8"
          />
          <button type="button" onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {visible ? <EyeSlash size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </SettingRow>

      <SettingRow label="AI Model" description="Used for summaries and parsing.">
        <div className="flex gap-1.5">
          {AI_MODELS.map((m) => {
            const sel = settings.aiModel === m.value;
            return (
              <button key={m.value} onClick={() => updateSetting("aiModel", m.value)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                  sel ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"
                }`}>
                <div className={`w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  sel ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {sel && <Check size={7} className="text-primary-foreground" />}
                </div>
                <div>
                  <div className="text-xs font-medium leading-tight">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SettingRow>
    </>
  );
}

function AppearanceContent() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const [showCustomHue, setShowCustomHue] = useState(false);

  const isCustomHue = !ACCENT_PRESETS.some((p) => p.hue === settings.accentHue);

  return (
    <>
      <SettingRow label="Theme" description="Light, dark, or match system.">
        <div className="flex gap-2.5">
          {(["system", "light", "dark"] as const).map((t) => (
            <ThemePreviewCard key={t} mode={t} isActive={theme === t} onClick={() => setTheme(t)} />
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Accent colour" description="Buttons, active states, focus rings.">
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {ACCENT_PRESETS.map((p) => {
              const sel = settings.accentHue === p.hue;
              return (
                <button key={p.hue} onClick={() => { updateSetting("accentHue", p.hue); setShowCustomHue(false); }}
                  className={`w-6 h-6 rounded-full transition-all ${sel ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110"}`}
                  style={{ backgroundColor: `oklch(0.55 0.2 ${p.hue})` }} title={p.label} />
              );
            })}
            <button onClick={() => setShowCustomHue(!showCustomHue)}
              className={`w-6 h-6 rounded-full border-2 text-[8px] font-bold transition-colors ${
                showCustomHue || isCustomHue ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
              style={isCustomHue ? { backgroundColor: `oklch(0.55 0.2 ${settings.accentHue})` } : {}}
              title="Custom">
              {!isCustomHue && "?"}
            </button>
          </div>
          {(showCustomHue || isCustomHue) && (
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="360" value={settings.accentHue}
                onChange={(e) => updateSetting("accentHue", Number(e.target.value))}
                className="w-36 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, oklch(0.55 0.2 0), oklch(0.55 0.2 60), oklch(0.55 0.2 120), oklch(0.55 0.2 180), oklch(0.55 0.2 240), oklch(0.55 0.2 300), oklch(0.55 0.2 360))` }} />
              <span className="text-[10px] font-mono text-muted-foreground">{settings.accentHue}°</span>
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow label="Font size" description="Scales the entire interface.">
        <div className="flex gap-1.5">
          {([
            { value: "sm" as const, label: "Small" },
            { value: "base" as const, label: "Default" },
            { value: "lg" as const, label: "Large" },
          ]).map((s) => {
            const sel = settings.fontSize === s.value;
            return (
              <button key={s.value} onClick={() => updateSetting("fontSize", s.value)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  sel ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}>
                {s.label}
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow label="Border radius" description="Roundness of UI elements.">
        <SliderControl value={settings.borderRadius} min={0} max={16} unit="px" onChange={(v) => updateSetting("borderRadius", v)} />
      </SettingRow>

      <SettingRow label="Sidebar width">
        <SliderControl value={settings.sidebarWidth} min={200} max={320} step={8} unit="px" onChange={(v) => updateSetting("sidebarWidth", v)} />
      </SettingRow>

      <SettingRow label="Panel gap" description="Space around content panel.">
        <SliderControl value={settings.contentPanelGap} min={0} max={12} unit="px" onChange={(v) => updateSetting("contentPanelGap", v)} />
      </SettingRow>

      <SettingRow label="Panel radius" description="Content panel corners.">
        <SliderControl value={settings.panelRadius} min={0} max={20} unit="px" onChange={(v) => updateSetting("panelRadius", v)} />
      </SettingRow>
    </>
  );
}

function DataContent() {
  const { resetSettings } = useSettings();
  return (
    <>
      <SettingRow label="Database">
        <span className="text-[11px] font-mono text-muted-foreground/60">%APPDATA%/ScholrTutor/scholrtutor.db</span>
      </SettingRow>
      <SettingRow label="Files">
        <span className="text-[11px] font-mono text-muted-foreground/60">%APPDATA%/ScholrTutor/files/</span>
      </SettingRow>
      <SettingRow label="Reset all settings" description="Restore defaults.">
        <Button variant="ghost" size="sm" onClick={resetSettings} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
          <ArrowCounterClockwise size={13} className="mr-1" /> Reset
        </Button>
      </SettingRow>
      <div className="pt-3 space-y-1">
        {[["Version", "1.1.0"], ["Electron", "41.x"], ["Next.js", "15.x"]].map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs text-muted-foreground py-1">
            <span>{k}</span><span className="font-mono text-muted-foreground/60">{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Page ──

const TABS = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "data", label: "Data & About" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure your ScholrTutor experience.
      </p>

      {/* Horizontal tabs */}
      <div className="flex gap-1 mt-6 border-b border-border/30">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.label}
              {active && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === "general" && <GeneralContent />}
        {activeTab === "appearance" && <AppearanceContent />}
        {activeTab === "data" && <DataContent />}
      </div>
    </div>
  );
}
