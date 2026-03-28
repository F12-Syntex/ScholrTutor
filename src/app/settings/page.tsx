"use client";

import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8 py-4 border-b border-border/15 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center shrink-0 ml-auto">{children}</div>
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
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Fast, cost-effective" },
  { value: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", desc: "Latest preview" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Most capable" },
];

// ── Pill selector ──

function PillSelect<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-muted/50 rounded-lg p-0.5 gap-0.5">
      {options.map((o) => {
        const sel = value === o.value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              sel
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Miniature layout preview ──

function LayoutPreview({ sidebarW, gap, radius }: { sidebarW: number; gap: number; radius: number }) {
  const sw = Math.round((sidebarW / 320) * 16);
  return (
    <div
      className="w-16 h-10 rounded-md overflow-hidden flex"
      style={{ backgroundColor: "var(--muted)", opacity: 0.6 }}
    >
      <div className="h-full" style={{ width: sw, opacity: 0.5, backgroundColor: "currentColor" }} />
      <div
        className="flex-1"
        style={{
          margin: gap * 0.4,
          borderRadius: radius * 0.4,
          backgroundColor: "var(--background)",
          opacity: 0.8,
        }}
      />
    </div>
  );
}

// ── Tab content ──

function GeneralContent() {
  const { settings, updateSetting } = useSettings();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <SettingRow label="OpenRouter API Key" description="Required for AI summaries.">
        <div className="relative w-60">
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
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                  sel ? "border-primary bg-primary/5" : "border-border/30 hover:border-border"
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
        <PillSelect
          options={[
            { value: "sm" as const, label: "Small" },
            { value: "base" as const, label: "Default" },
            { value: "lg" as const, label: "Large" },
          ]}
          value={settings.fontSize}
          onChange={(v) => updateSetting("fontSize", v)}
        />
      </SettingRow>

      <SettingRow label="Border radius" description="Roundness of buttons, inputs, cards.">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {([
              { value: 0, label: "Sharp" },
              { value: 6, label: "Subtle" },
              { value: 10, label: "Medium" },
              { value: 16, label: "Round" },
            ]).map((r) => {
              const sel = settings.borderRadius === r.value;
              return (
                <button key={r.value} onClick={() => updateSetting("borderRadius", r.value)}
                  className={`flex flex-col items-center gap-1 group`}>
                  <div className={`w-8 h-8 border-2 transition-colors ${
                    sel ? "border-primary" : "border-muted-foreground/20 group-hover:border-muted-foreground/40"
                  }`} style={{ borderRadius: r.value }} />
                  <span className={`text-[10px] ${sel ? "text-foreground font-medium" : "text-muted-foreground"}`}>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingRow>

      <SettingRow label="Sidebar width" description="Navigation panel width.">
        <PillSelect
          options={[
            { value: 208, label: "Narrow" },
            { value: 256, label: "Default" },
            { value: 304, label: "Wide" },
          ]}
          value={settings.sidebarWidth}
          onChange={(v) => updateSetting("sidebarWidth", v)}
        />
      </SettingRow>

      <SettingRow label="Panel style" description="Content panel gap and corners.">
        <div className="flex gap-2">
          {([
            { gap: 0, radius: 0, label: "Flush" },
            { gap: 4, radius: 8, label: "Subtle" },
            { gap: 8, radius: 12, label: "Inset" },
            { gap: 10, radius: 16, label: "Float" },
          ]).map((p) => {
            const sel = settings.contentPanelGap === p.gap && settings.panelRadius === p.radius;
            return (
              <button key={p.label} onClick={() => { updateSetting("contentPanelGap", p.gap); updateSetting("panelRadius", p.radius); }}
                className="flex flex-col items-center gap-1 group">
                <div className={`w-14 h-9 rounded-md overflow-hidden flex border-2 transition-colors ${
                  sel ? "border-primary" : "border-transparent group-hover:border-border/40"
                }`} style={{ backgroundColor: "var(--muted)", opacity: sel ? 1 : 0.5 }}>
                  <div className="w-4 h-full" style={{ opacity: 0.4 }} />
                  <div className="flex-1" style={{ margin: p.gap * 0.4, borderRadius: p.radius * 0.4, backgroundColor: "var(--background)", opacity: 0.8 }} />
                </div>
                <span className={`text-[10px] ${sel ? "text-foreground font-medium" : "text-muted-foreground"}`}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </SettingRow>
    </>
  );
}

function DataContent() {
  const { resetSettings } = useSettings();
  const importRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState("");

  const DB_KEYS = [
    "scholrtutor-subjects",
    "scholrtutor-students",
    "scholrtutor-session-logs",
    "scholrtutor-settings",
  ];

  const handleExport = () => {
    const data: Record<string, unknown> = { _export: "scholrtutor", _version: "2.3", _date: new Date().toISOString() };
    for (const key of DB_KEYS) {
      try { data[key] = JSON.parse(localStorage.getItem(key) || "null"); } catch { data[key] = null; }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scholrtutor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data._export !== "scholrtutor") { setImportStatus("Invalid backup file."); return; }
        for (const key of DB_KEYS) {
          if (data[key] !== undefined && data[key] !== null) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }
        setImportStatus("Imported successfully. Reloading...");
        setTimeout(() => window.location.reload(), 800);
      } catch { setImportStatus("Failed to parse backup file."); }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <SettingRow label="Export database" description="Download all data as a JSON backup.">
        <Button variant="outline" size="sm" onClick={handleExport} className="h-7 text-xs">
          <DownloadSimple size={13} className="mr-1" /> Export
        </Button>
      </SettingRow>
      <SettingRow label="Import database" description="Restore from a backup file. Overwrites current data.">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} className="h-7 text-xs">
            <UploadSimple size={13} className="mr-1" /> Import
          </Button>
          <input ref={importRef} type="file" accept=".json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ""; }} />
          {importStatus && <span className="text-xs text-muted-foreground">{importStatus}</span>}
        </div>
      </SettingRow>
      <SettingRow label="Reset all settings" description="Restore defaults. Does not delete data.">
        <Button variant="ghost" size="sm" onClick={resetSettings} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
          <ArrowCounterClockwise size={13} className="mr-1" /> Reset
        </Button>
      </SettingRow>
      <div className="pt-4 flex gap-6">
        {[["Version", "2.3.2"], ["Electron", "41.x"], ["Next.js", "15.x"]].map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{k}</span><span className="font-mono text-muted-foreground/50">{v}</span>
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
    <div className="p-8">
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
      <div className="mt-2">
        {activeTab === "general" && <GeneralContent />}
        {activeTab === "appearance" && <AppearanceContent />}
        {activeTab === "data" && <DataContent />}
      </div>
    </div>
  );
}
