"use client";

import { useEffect, useMemo, useState } from "react";
import { useSubjects } from "@/lib/subjects";
import {
  loadSessionLogs,
  SESSION_SLOTS,
  formatSlotTime,
  toDateKey,
  type SessionLogEntry,
  type ParsedStudentData,
} from "@/lib/session-log";
import { DateNav } from "../_components/date-nav";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LogEntry({ log }: { log: SessionLogEntry }) {
  const { subjects } = useSubjects();
  const topicById = useMemo(() => {
    const m = new Map<string, { code: string; title: string }>();
    for (const sub of subjects) for (const t of sub.topics) m.set(t.id, t);
    return m;
  }, [subjects]);
  const hasParsed = log.parsedData && log.parsedData.students.length > 0;

  return (
    <div className="flex gap-3 py-2.5">
      <span className="w-12 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">
        {formatTime(log.createdAt)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap text-sm">{log.rawText}</p>
        {hasParsed && (
          <div className="mt-1.5 space-y-1">
            {log.parsedData!.students.map((sd: ParsedStudentData) => (
              <div key={sd.studentId} className="space-y-1">
                {sd.notes.map((note, i) => (
                  <p
                    key={i}
                    className="border-l-2 border-border pl-2 text-xs text-muted-foreground"
                  >
                    {note}
                  </p>
                ))}
                {sd.testResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 pl-2 text-xs"
                  >
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="font-medium tabular-nums">
                      {r.scoreGot}/{r.scoreOf}
                    </span>
                    <span className="text-muted-foreground">
                      ({Math.round((r.scoreGot / r.scoreOf) * 100)}%)
                    </span>
                  </div>
                ))}
                {sd.topicIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-2">
                    {sd.topicIds.map((tid) => {
                      const topic = topicById.get(tid);
                      return (
                        <span
                          key={tid}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            topic
                              ? "bg-[color-mix(in_srgb,var(--mention-topic)_15%,transparent)] text-[var(--mention-topic)]"
                              : "bg-muted text-muted-foreground line-through"
                          }`}
                        >
                          {topic ? `${topic.code} ${topic.title}` : "[deleted]"}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionSlotBlock({
  slot,
  logs,
}: {
  slot: number;
  logs: SessionLogEntry[];
}) {
  const slotDef = SESSION_SLOTS[slot];
  const hasEntries = logs.length > 0;

  return (
    <section
      className={`overflow-hidden rounded-lg border ${
        hasEntries ? "border-border" : "border-border/50"
      }`}
    >
      <header
        className={`flex items-center justify-between px-4 py-2.5 ${
          hasEntries ? "bg-muted/80" : "bg-muted/40"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              hasEntries ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {slotDef.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatSlotTime(slot)}
          </span>
        </div>
        {hasEntries && (
          <span className="text-xs text-muted-foreground">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </header>
      {hasEntries ? (
        <div className="divide-y divide-border bg-card px-4">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <div className="bg-card/50 px-4 py-3">
          <p className="text-center text-xs text-muted-foreground">No entries</p>
        </div>
      )}
    </section>
  );
}

export default function SessionPage() {
  const [allLogs, setAllLogs] = useState<SessionLogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    setAllLogs(loadSessionLogs());
  }, []);

  const dateKey = toDateKey(selectedDate);

  const dayLogs = useMemo(
    () => allLogs.filter((l) => toDateKey(new Date(l.createdAt)) === dateKey),
    [allLogs, dateKey],
  );

  const slotLogs = useMemo(() => {
    const grouped: SessionLogEntry[][] = SESSION_SLOTS.map(() => []);
    for (const log of dayLogs) {
      const slot = log.sessionSlot ?? 0;
      if (slot >= 0 && slot < grouped.length) grouped[slot].push(log);
    }
    for (const arr of grouped)
      arr.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    return grouped;
  }, [dayLogs]);

  return (
    <div className="flex h-full flex-col p-4 sm:p-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Session Times</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log entries grouped by session time slots.
        </p>
      </header>

      <div className="mt-5 shrink-0">
        <DateNav
          date={selectedDate}
          onChange={setSelectedDate}
          trailing={
            <span className="text-xs text-muted-foreground">
              {dayLogs.length} {dayLogs.length === 1 ? "entry" : "entries"}
            </span>
          }
        />
      </div>

      <div className="scroll-panel mt-5 flex-1 min-h-0 space-y-3 overflow-auto">
        {SESSION_SLOTS.map((_, i) => (
          <SessionSlotBlock key={i} slot={i} logs={slotLogs[i]} />
        ))}
      </div>
    </div>
  );
}
