"use client";

import { useEffect, useMemo, useState } from "react";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { Notebook } from "@phosphor-icons/react/dist/ssr/Notebook";
import { Exam } from "@phosphor-icons/react/dist/ssr/Exam";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import { SessionLogInput } from "@/components/session-log-input";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import {
  loadSessionLogs,
  toDateKey,
  type SessionLogEntry,
} from "@/lib/session-log";
import { StatCard } from "./_components/stat-card";
import { LogCard } from "./_components/log-card";

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function scoreTone(ratio: number) {
  if (ratio >= 0.7) return "text-success";
  if (ratio >= 0.4) return "text-warning";
  return "text-destructive";
}

export default function DashboardPage() {
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const [logs, setLogs] = useState<SessionLogEntry[]>([]);
  const refresh = () => setLogs(loadSessionLogs());

  useEffect(() => {
    refresh();
  }, []);

  const todayKey = toDateKey(new Date());
  const todayLogs = useMemo(
    () => logs.filter((l) => toDateKey(new Date(l.createdAt)) === todayKey),
    [logs, todayKey],
  );

  const recentTests = useMemo(() => {
    const all: {
      studentName: string;
      name: string;
      scoreGot: number;
      scoreOf: number;
      date: string;
    }[] = [];
    for (const s of students)
      for (const r of s.testResults)
        all.push({
          studentName: s.name,
          name: r.name,
          scoreGot: r.scoreGot,
          scoreOf: r.scoreOf,
          date: r.createdAt,
        });
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [students]);

  const recentNotes = useMemo(() => {
    const all: { studentName: string; content: string; date: string }[] = [];
    for (const s of students)
      for (const n of s.notes)
        all.push({
          studentName: s.name,
          content: n.content,
          date: n.createdAt,
        });
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [students]);

  const totalNotes = students.reduce((s, st) => s + st.notes.length, 0);
  const testAvg =
    recentTests.length > 0
      ? `${Math.round(
          recentTests.reduce(
            (s, r) => s + (r.scoreGot / r.scoreOf) * 100,
            0,
          ) / recentTests.length,
        )}%`
      : "—";

  return (
    <div className="flex h-full flex-col p-4 sm:p-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your tutoring activity.
        </p>
      </header>

      <div className="mt-6 shrink-0">
        <SessionLogInput onLogSubmitted={refresh} />
      </div>

      <div className="scroll-panel mt-6 flex-1 min-h-0 space-y-6 overflow-auto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Users}
            label="Students"
            value={students.length}
            sub={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={Clock}
            label="Today"
            value={todayLogs.length}
            sub={todayLogs.length === 1 ? "log entry" : "log entries"}
          />
          <StatCard
            icon={Exam}
            label="Tests"
            value={testAvg}
            sub={
              recentTests.length > 0
                ? `avg across ${recentTests.length} recent`
                : "no results yet"
            }
          />
          <StatCard
            icon={Notebook}
            label="Notes"
            value={totalNotes}
            sub="total across all students"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Exam size={14} /> Recent test results
            </h2>
            {recentTests.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No test results yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {recentTests.map((r, i) => (
                  <li key={i} className="flex flex-col gap-0.5 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {r.name}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {r.scoreGot}/{r.scoreOf}
                      </span>
                      <span
                        className={`text-xs font-medium tabular-nums ${scoreTone(
                          r.scoreGot / r.scoreOf,
                        )}`}
                      >
                        {Math.round((r.scoreGot / r.scoreOf) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {r.studentName} · {formatDateShort(r.date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Notebook size={14} /> Recent notes
            </h2>
            {recentNotes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No notes yet.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {recentNotes.map((n, i) => (
                  <li key={i} className="px-3 py-2.5">
                    <p className="text-sm">{n.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.studentName} · {formatDateShort(n.date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {logs.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Recent logs
            </h2>
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
