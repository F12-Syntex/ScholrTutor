"use client";

import { useState, useEffect } from "react";
import { SessionLogInput } from "@/components/session-log-input";
import { loadSessionLogs, type SessionLogEntry } from "@/lib/session-log";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<SessionLogEntry[]>([]);
  const refresh = () => setLogs(loadSessionLogs().slice(0, 10));

  useEffect(() => { refresh(); }, []);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your tutoring activity.</p>
      </div>

      {/* Session log input */}
      <div className="mt-6 shrink-0">
        <SessionLogInput onLogSubmitted={refresh} />
      </div>

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="mt-6 flex-1 min-h-0 overflow-auto">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Logs</h2>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="rounded-lg border border-border/40 bg-card px-4 py-3">
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{log.rawText}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground/40">{formatDate(log.createdAt)}</span>
                  {log.parsedData && log.parsedData.students.length > 0 && (
                    <span className="text-[10px] text-muted-foreground/40">
                      {log.parsedData.students.map(s => s.studentName).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
