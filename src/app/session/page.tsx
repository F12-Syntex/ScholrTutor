"use client";

import { useState, useEffect, useMemo } from "react";
import { useSubjects } from "@/lib/subjects";
import {
  loadSessionLogs,
  SESSION_SLOTS,
  formatSlotTime,
  toDateKey,
  type SessionLogEntry,
  type ParsedStudentData,
} from "@/lib/session-log";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";

function formatDateHeading(date: Date): string {
  const today = new Date();
  const todayKey = toDateKey(today);
  const dateKey = toDateKey(date);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === todayKey) return "Today";
  if (dateKey === toDateKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function LogEntry({ log }: { log: SessionLogEntry }) {
  const { subjects } = useSubjects();
  const allTopics = subjects.flatMap(s => s.topics);
  const hasParsed = log.parsedData && log.parsedData.students.length > 0;

  return (
    <div className="flex gap-3 py-2.5">
      <span className="text-[10px] font-mono text-muted-foreground/40 pt-0.5 shrink-0 w-12">{formatTime(log.createdAt)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{log.rawText}</p>
        {hasParsed && (
          <div className="mt-1.5 space-y-1">
            {log.parsedData!.students.map((sd: ParsedStudentData) => (
              <div key={sd.studentId} className="space-y-1">
                {sd.notes.map((note, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-border/30">{note}</p>
                ))}
                {sd.testResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs pl-2">
                    <span className="text-muted-foreground">{r.name}</span>
                    <span className="font-medium tabular-nums">{r.scoreGot}/{r.scoreOf}</span>
                    <span className="text-muted-foreground/50">({Math.round((r.scoreGot / r.scoreOf) * 100)}%)</span>
                  </div>
                ))}
                {sd.topicIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-2">
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
    </div>
  );
}

function SessionSlotBlock({ slot, logs }: { slot: number; logs: SessionLogEntry[] }) {
  const slotDef = SESSION_SLOTS[slot];
  const hasEntries = logs.length > 0;

  return (
    <div className={`rounded-lg border overflow-hidden ${hasEntries ? "border-border/50" : "border-border/20"}`}>
      <div className={`px-4 py-2.5 flex items-center justify-between ${hasEntries ? "bg-muted/80" : "bg-muted/30"}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${hasEntries ? "text-foreground" : "text-muted-foreground/40"}`}>{slotDef.label}</span>
          <span className={`text-[10px] ${hasEntries ? "text-muted-foreground/60" : "text-muted-foreground/30"}`}>{formatSlotTime(slot)}</span>
        </div>
        {hasEntries && (
          <span className="text-[10px] text-muted-foreground/40">{logs.length} {logs.length === 1 ? "entry" : "entries"}</span>
        )}
      </div>
      {hasEntries ? (
        <div className="bg-card px-4 divide-y divide-border/15">
          {logs.map(log => <LogEntry key={log.id} log={log} />)}
        </div>
      ) : (
        <div className="bg-card/50 px-4 py-3">
          <p className="text-xs text-muted-foreground/30 text-center">No entries</p>
        </div>
      )}
    </div>
  );
}

export default function SessionPage() {
  const [allLogs, setAllLogs] = useState<SessionLogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const refresh = () => setAllLogs(loadSessionLogs());

  useEffect(() => { refresh(); }, []);

  const dateKey = toDateKey(selectedDate);

  const dayLogs = useMemo(() =>
    allLogs.filter(l => toDateKey(new Date(l.createdAt)) === dateKey),
    [allLogs, dateKey]
  );

  const slotLogs = useMemo(() => {
    const grouped: SessionLogEntry[][] = SESSION_SLOTS.map(() => []);
    for (const log of dayLogs) {
      const slot = log.sessionSlot ?? 0;
      if (slot >= 0 && slot < grouped.length) grouped[slot].push(log);
    }
    for (const arr of grouped) arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return grouped;
  }, [dayLogs]);

  const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
  const isToday = dateKey === toDateKey(new Date());

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-3xl font-medium tracking-tight">Session Times</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log entries grouped by session time slots.</p>
      </div>

      {/* Date nav */}
      <div className="mt-5 flex items-center gap-2 shrink-0">
        <button onClick={prevDay} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <CaretLeft size={16} />
        </button>
        <span className="text-sm font-medium min-w-[180px] text-center">{formatDateHeading(selectedDate)}</span>
        <button onClick={nextDay} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <CaretRight size={16} />
        </button>
        {!isToday && (
          <button onClick={() => setSelectedDate(new Date())} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">Today</button>
        )}
        <span className="text-xs text-muted-foreground/40 ml-auto">
          {dayLogs.length} {dayLogs.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* Slots */}
      <div className="mt-5 flex-1 min-h-0 overflow-auto space-y-3">
        {SESSION_SLOTS.map((_, i) => (
          <SessionSlotBlock key={i} slot={i} logs={slotLogs[i]} />
        ))}
      </div>
    </div>
  );
}
