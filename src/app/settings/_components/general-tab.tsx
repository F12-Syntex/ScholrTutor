"use client";

import { useState } from "react";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { useSettings } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingRow } from "./setting-row";

const AI_MODELS = [
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

export function GeneralTab() {
  const { settings, updateSetting } = useSettings();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <SettingRow
        label="OpenRouter API Key"
        description="Required for AI summaries and parsing."
      >
        <div className="relative w-full sm:w-64">
          <Input
            type={visible ? "text" : "password"}
            value={settings.openRouterApiKey}
            onChange={(e) => updateSetting("openRouterApiKey", e.target.value)}
            placeholder="sk-or-v1-..."
            className="h-9 pr-9 font-mono text-xs"
            aria-label="OpenRouter API key"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide API key" : "Show API key"}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {visible ? <EyeSlash size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </SettingRow>

      <SettingRow label="AI Model" description="Used for summaries and parsing.">
        <Select
          value={settings.aiModel}
          onValueChange={(v) => v && updateSetting("aiModel", v)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </>
  );
}
