"use client";

import { useRef, useState } from "react";
import { useSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { APP_VERSION } from "@/lib/app-info";
import { SettingRow } from "./setting-row";

const DB_KEYS = [
  "scholrtutor-subjects",
  "scholrtutor-students",
  "scholrtutor-session-logs",
  "scholrtutor-settings",
];

export function DataTab() {
  const { resetSettings } = useSettings();
  const importRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "info" | "error"; msg: string } | null>(
    null,
  );

  const handleExport = () => {
    const data: Record<string, unknown> = {
      _export: "scholrtutor",
      _version: APP_VERSION,
      _date: new Date().toISOString(),
    };
    for (const key of DB_KEYS) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        data[key] = null;
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scholrtutor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: "info", msg: "Backup downloaded." });
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data._export !== "scholrtutor") {
          setStatus({ kind: "error", msg: "Invalid backup file." });
          return;
        }
        for (const key of DB_KEYS) {
          if (data[key] !== undefined && data[key] !== null) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        }
        setStatus({ kind: "info", msg: "Imported. Reloading…" });
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setStatus({ kind: "error", msg: "Failed to parse backup file." });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <SettingRow
        label="Export database"
        description="Download all data as a JSON backup."
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <DownloadSimple size={14} className="mr-1" /> Export
        </Button>
      </SettingRow>

      <SettingRow
        label="Import database"
        description="Restore from a backup file. Overwrites current data."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => importRef.current?.click()}
        >
          <UploadSimple size={14} className="mr-1" /> Import
        </Button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = "";
          }}
        />
      </SettingRow>

      <SettingRow
        label="Reset all settings"
        description="Restore defaults. Does not delete data."
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetSettings();
            setStatus({ kind: "info", msg: "Settings restored to defaults." });
          }}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <ArrowCounterClockwise size={14} className="mr-1" /> Reset
        </Button>
      </SettingRow>

      {status && (
        <p
          role="status"
          className={`pt-4 text-xs ${
            status.kind === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {status.msg}
        </p>
      )}

      <div className="pt-6 flex flex-wrap gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Version</span>
          <span className="font-mono text-foreground/70">{APP_VERSION}</span>
        </div>
      </div>
    </>
  );
}
