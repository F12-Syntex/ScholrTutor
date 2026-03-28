"use client";

import { useState, useEffect, useMemo } from "react";
import { SessionLogInput } from "@/components/session-log-input";
import { useStudents, type Student } from "@/lib/students";
import { useSubjects, type Topic } from "@/lib/subjects";
import { loadSessionLogs, toDateKey, type SessionLogEntry, type ParsedStudentData } from "@/lib/session-log";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { Notebook } from "@phosphor-icons/react/dist/ssr/Notebook";
import { Exam } from "@phosphor-icons/react/dist/ssr/Exam";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";

// ── Render @mentions as highlighted chips ──

function RichLogText({ text }: { text: string }) {
  const { students } = useStudents();
  const { subjects } = useSubjects();

  const parts: React.ReactNode[] = [];
  const regex = /@(student|topic)\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    const type = match[1] as "student" | "topic";
    const label = match[2];

    // Resolve current name (handles renames)
    let displayName = label;
    if (type === "student") {
      const s = students.find(st => st.name.toLowerCase() === label.toLowerCase());
      if (s) displayName = s.name;
    } else {
      const allTopics = subjects.flatMap(s => s.topics);
      const t = allTopics.find(tp => `${tp.code} ${tp.title}`.toLowerCase() === label.toLowerCase() || tp.code === label.split(" ")[0]);
      if (t) displayName = `${t.code} ${t.title}`;
    }

    parts.push(
      <span key={match.index} className="mention-chip" data-mention-type={type}>
        {displayName}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <span className="whitespace-pre-wrap">{parts}</span>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── Stat card ──

function StatCard({ icon: IconComp, label, value, sub }: {
  icon: Icon;
  label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <IconComp size={14} className="text-muted-foreground/40" weight="regular" />
        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-medium tabular-nums">{value}</div>
      {sub && <p className="text-[10px] text-muted-foreground/40 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Log card with rich text ──

function LogCard({ log }: { log: SessionLogEntry }) {
  const { subjects } = useSubjects();
  const allTopics = subjects.flatMap(s => s.topics);
  const hasParsed = log.parsedData && log.parsedData.students.length > 0;

  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <div className="px-4 py-3 bg-card">
        <p className="text-sm text-foreground/80"><RichLogText text={log.rawText} /></p>
        <p className="text-[10px] text-muted-foreground/40 mt-2">{formatDate(log.createdAt)}</p>
      </div>
      {hasParsed && (
        <div className="border-t border-border/20 bg-muted/30 px-4 py-2.5 space-y-2">
          {log.parsedData!.students.map((sd: ParsedStudentData) => (
            <div key={sd.studentId} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[var(--mention-student)] shrink-0" />
                <span className="text-xs font-medium">{sd.studentName}</span>
              </div>
              {sd.notes.map((note, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-3.5 border-l-2 border-border/30">{note}</p>
              ))}
              {sd.testResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs pl-3.5">
                  <span className="text-muted-foreground">{r.name}</span>
                  <span className="font-medium tabular-nums">{r.scoreGot}/{r.scoreOf}</span>
                  <span className="text-muted-foreground/50">({Math.round((r.scoreGot / r.scoreOf) * 100)}%)</span>
                </div>
              ))}
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

// ── Page ──

export default function DashboardPage() {
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const [logs, setLogs] = useState<SessionLogEntry[]>([]);
  const refresh = () => setLogs(loadSessionLogs());

  useEffect(() => { refresh(); }, []);

  const todayKey = toDateKey(new Date());
  const todayLogs = useMemo(() => logs.filter(l => toDateKey(new Date(l.createdAt)) === todayKey), [logs, todayKey]);

  // Collect all recent test results across all students (last 8)
  const recentTests = useMemo(() => {
    const all: { studentName: string; name: string; scoreGot: number; scoreOf: number; date: string }[] = [];
    for (const s of students) {
      for (const r of s.testResults) {
        all.push({ studentName: s.name, name: r.name, scoreGot: r.scoreGot, scoreOf: r.scoreOf, date: r.createdAt });
      }
    }
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
  }, [students]);

  // Collect recent notes across all students (last 5)
  const recentNotes = useMemo(() => {
    const all: { studentName: string; content: string; date: string }[] = [];
    for (const s of students) {
      for (const n of s.notes) {
        all.push({ studentName: s.name, content: n.content, date: n.createdAt });
      }
    }
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [students]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-3xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your tutoring activity.</p>
      </div>

      {/* Quick log */}
      <div className="mt-6 shrink-0">
        <SessionLogInput onLogSubmitted={refresh} />
      </div>

      <div className="mt-6 flex-1 min-h-0 overflow-auto space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Students" value={students.length} sub={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`} />
          <StatCard icon={Clock} label="Today" value={todayLogs.length} sub={todayLogs.length === 1 ? "log entry" : "log entries"} />
          <StatCard icon={Exam} label="Tests" value={recentTests.length > 0 ? `${Math.round(recentTests.reduce((s, r) => s + (r.scoreGot / r.scoreOf) * 100, 0) / recentTests.length)}%` : "—"} sub={recentTests.length > 0 ? `avg across ${recentTests.length} recent` : "no results yet"} />
          <StatCard icon={Notebook} label="Notes" value={students.reduce((s, st) => s + st.notes.length, 0)} sub="total across all students" />
        </div>

        {/* Two column: Recent Tests + Recent Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent test results */}
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/80 flex items-center gap-2">
              <Exam size={14} className="text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">Recent Test Results</span>
            </div>
            {recentTests.length === 0 ? (
              <div className="px-4 py-6 bg-card text-center">
                <p className="text-xs text-muted-foreground/40">No test results yet.</p>
              </div>
            ) : (
              <div className="bg-card divide-y divide-border/15">
                {recentTests.map((r, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{r.name}</span>
                        <span className="text-sm tabular-nums text-muted-foreground shrink-0">{r.scoreGot}/{r.scoreOf}</span>
                        <span className={`text-xs tabular-nums shrink-0 ${
                          (r.scoreGot / r.scoreOf) >= 0.7 ? "text-success" : (r.scoreGot / r.scoreOf) >= 0.4 ? "text-warning" : "text-destructive"
                        }`}>
                          {Math.round((r.scoreGot / r.scoreOf) * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">{r.studentName} · {formatDateShort(r.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent notes */}
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/80 flex items-center gap-2">
              <Notebook size={14} className="text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">Recent Notes</span>
            </div>
            {recentNotes.length === 0 ? (
              <div className="px-4 py-6 bg-card text-center">
                <p className="text-xs text-muted-foreground/40">No notes yet.</p>
              </div>
            ) : (
              <div className="bg-card divide-y divide-border/15 max-h-64 overflow-auto">
                {recentNotes.map((n, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <p className="text-sm text-foreground/80">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-1">{n.studentName} · {formatDateShort(n.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent logs */}
        {logs.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent Logs</h2>
            <div className="space-y-2">
              {logs.slice(0, 10).map(log => <LogCard key={log.id} log={log} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
