"use client";

import { useState, useEffect } from "react";
import { SessionLogInput } from "@/components/session-log-input";
import { useSubjects } from "@/lib/subjects";
import { loadSessionLogs, type SessionLogEntry, type ParsedStudentData } from "@/lib/session-log";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function LogCard({ log }: { log: SessionLogEntry }) {
  const { subjects } = useSubjects();
  const allTopics = subjects.flatMap(s => s.topics);
  const hasParsed = log.parsedData && log.parsedData.students.length > 0;

  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      {/* Raw text */}
      <div className="px-4 py-3 bg-card">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{log.rawText}</p>
        <p className="text-[10px] text-muted-foreground/40 mt-2">{formatDate(log.createdAt)}</p>
      </div>

      {/* Parsed summary */}
      {hasParsed && (
        <div className="border-t border-border/20 bg-muted/30 px-4 py-2.5 space-y-2">
          {log.parsedData!.students.map((sd: ParsedStudentData) => (
            <div key={sd.studentId} className="space-y-1.5">
              {/* Student name + session badge */}
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--mention-student)] shrink-0" />
                <span className="text-xs font-medium">{sd.studentName}</span>
              </div>

              {/* Notes */}
              {sd.notes.map((note, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-3.5 border-l-2 border-border/30">{note}</p>
              ))}

              {/* Test results */}
              {sd.testResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs pl-3.5">
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="font-medium tabular-nums">{r.scoreGot}/{r.scoreOf}</span>
                  <span className="text-muted-foreground/50">({Math.round((r.scoreGot / r.scoreOf) * 100)}%)</span>
                </div>
              ))}

              {/* Topics */}
              {sd.topicIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-3.5">
                  {sd.topicIds.map(tid => {
                    const topic = allTopics.find(t => t.id === tid);
                    return topic ? (
                      <span key={tid} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--mention-topic)_15%,transparent)] text-[var(--mention-topic)]">
                        {topic.code} {topic.title}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

      <div className="mt-6 shrink-0">
        <SessionLogInput onLogSubmitted={refresh} />
      </div>

      {logs.length > 0 && (
        <div className="mt-6 flex-1 min-h-0 overflow-auto">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Logs</h2>
          <div className="space-y-2">
            {logs.map(log => <LogCard key={log.id} log={log} />)}
          </div>
        </div>
      )}
    </div>
  );
}
