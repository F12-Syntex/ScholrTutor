"use client";

import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings";
import { Sun } from "@phosphor-icons/react/dist/ssr/Sun";
import { Moon } from "@phosphor-icons/react/dist/ssr/Moon";
import { Desktop } from "@phosphor-icons/react/dist/ssr/Desktop";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { SettingRow } from "./setting-row";

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

const THEMES: { id: "system" | "light" | "dark"; label: string; Icon: Icon }[] = [
  { id: "system", label: "System", Icon: Desktop },
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
];

type PillOption<T extends string | number> = { value: T; label: string };

function PillSelect<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg bg-muted/60 p-0.5 gap-0.5"
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`h-7 rounded-md px-3 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
              selected
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

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting } = useSettings();
  const isCustomHue = !ACCENT_PRESETS.some((p) => p.hue === settings.accentHue);

  return (
    <>
      <SettingRow label="Theme" description="Light, dark, or match system.">
        <div role="radiogroup" aria-label="Theme" className="flex gap-2">
          {THEMES.map(({ id, label, Icon }) => {
            const active = theme === id;
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(id)}
                className={`flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg border px-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon size={16} />
                <span className="text-[11px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow
        label="Accent colour"
        description="Buttons, active states, focus rings."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {ACCENT_PRESETS.map((p) => {
              const active = settings.accentHue === p.hue;
              return (
                <button
                  key={p.hue}
                  onClick={() => updateSetting("accentHue", p.hue)}
                  aria-label={p.label}
                  aria-pressed={active}
                  className={`size-7 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    active
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: `oklch(0.55 0.2 ${p.hue})` }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5">
              <input
                type="range"
                min={0}
                max={360}
                value={settings.accentHue}
                onChange={(e) => updateSetting("accentHue", Number(e.target.value))}
                aria-label="Custom hue"
                className="h-1.5 w-32 cursor-pointer appearance-none rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, oklch(0.55 0.2 0), oklch(0.55 0.2 60), oklch(0.55 0.2 120), oklch(0.55 0.2 180), oklch(0.55 0.2 240), oklch(0.55 0.2 300), oklch(0.55 0.2 360))",
                }}
              />
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-8">
                {settings.accentHue}°
              </span>
            </label>
            {isCustomHue && (
              <span className="text-[10px] text-muted-foreground/70">custom</span>
            )}
          </div>
        </div>
      </SettingRow>

      <SettingRow label="Font size" description="Scales the entire interface.">
        <PillSelect
          label="Font size"
          options={[
            { value: "sm" as const, label: "Small" },
            { value: "base" as const, label: "Default" },
            { value: "lg" as const, label: "Large" },
          ]}
          value={settings.fontSize}
          onChange={(v) => updateSetting("fontSize", v)}
        />
      </SettingRow>

      <SettingRow
        label="Border radius"
        description="Roundness of buttons, inputs, cards."
      >
        <div role="radiogroup" aria-label="Border radius" className="flex gap-2">
          {[
            { value: 0, label: "Sharp" },
            { value: 6, label: "Subtle" },
            { value: 10, label: "Medium" },
            { value: 16, label: "Round" },
          ].map((r) => {
            const active = settings.borderRadius === r.value;
            return (
              <button
                key={r.value}
                role="radio"
                aria-checked={active}
                onClick={() => updateSetting("borderRadius", r.value)}
                className="flex flex-col items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md p-1"
              >
                <div
                  className={`size-8 border-2 transition-colors ${
                    active
                      ? "border-primary"
                      : "border-muted-foreground/20 hover:border-muted-foreground/40"
                  }`}
                  style={{ borderRadius: r.value }}
                />
                <span
                  className={`text-[10px] ${
                    active ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {r.label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow label="Sidebar width" description="Navigation panel width.">
        <PillSelect
          label="Sidebar width"
          options={[
            { value: 208, label: "Narrow" },
            { value: 256, label: "Default" },
            { value: 304, label: "Wide" },
          ]}
          value={settings.sidebarWidth}
          onChange={(v) => updateSetting("sidebarWidth", v)}
        />
      </SettingRow>

      <SettingRow
        label="Panel style"
        description="Content panel gap and corners."
      >
        <div role="radiogroup" aria-label="Panel style" className="flex gap-2">
          {[
            { gap: 0, radius: 0, label: "Flush" },
            { gap: 4, radius: 8, label: "Subtle" },
            { gap: 8, radius: 12, label: "Inset" },
            { gap: 10, radius: 16, label: "Float" },
          ].map((p) => {
            const active =
              settings.contentPanelGap === p.gap && settings.panelRadius === p.radius;
            return (
              <button
                key={p.label}
                role="radio"
                aria-checked={active}
                onClick={() => {
                  updateSetting("contentPanelGap", p.gap);
                  updateSetting("panelRadius", p.radius);
                }}
                className="flex flex-col items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-md p-1"
              >
                <div
                  className={`flex h-9 w-14 overflow-hidden rounded-md border-2 transition-colors ${
                    active ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div className="h-full w-4 opacity-50" />
                  <div
                    className="flex-1"
                    style={{
                      margin: p.gap * 0.4,
                      borderRadius: p.radius * 0.4,
                      backgroundColor: "var(--background)",
                      opacity: 0.9,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] ${
                    active ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingRow>
    </>
  );
}
