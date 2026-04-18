"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import {
  loadSessionLogs,
  toDateKey,
  type SessionLogEntry,
} from "@/lib/session-log";
import { Button } from "@/components/ui/button";
import { DateNav } from "../_components/date-nav";
import {
  buildDayContext,
  generateSummary,
  type DaySummary,
} from "./_components/generate";
import { StudentSummaryCard } from "./_components/student-summary-card";

export default function SummaryPage() {
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const { settings } = useSettings();
  const [allLogs, setAllLogs] = useState<SessionLogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAllLogs(loadSessionLogs());
  }, []);

  const dateKey = toDateKey(selectedDate);
  const dayLogs = useMemo(
    () => allLogs.filter((l) => toDateKey(new Date(l.createdAt)) === dateKey),
    [allLogs, dateKey],
  );

  useEffect(() => {
    setSummary(null);
    setError("");
  }, [dateKey]);

  const handleGenerate = async () => {
    if (dayLogs.length === 0) return;
    if (!settings.openRouterApiKey) {
      setError("No API key. Go to Settings.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const context = buildDayContext(dayLogs, students, subjects);
      const result = await generateSummary(
        context,
        settings.openRouterApiKey,
        settings.aiModel,
      );
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-4 sm:p-8">
      <header className="shrink-0">
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
          Student Summary
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated daily reports, student by student.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-3 shrink-0">
        <DateNav
          date={selectedDate}
          onChange={setSelectedDate}
          trailing={
            <span className="text-xs text-muted-foreground">
              {dayLogs.length} {dayLogs.length === 1 ? "entry" : "entries"}
            </span>
          }
        />
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={loading || dayLogs.length === 0}
          className="ml-auto"
        >
          {loading ? (
            <>
              <CircleNotch size={14} className="mr-1.5 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkle size={14} className="mr-1.5" /> Generate report
            </>
          )}
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive shrink-0"
        >
          {error}
        </div>
      )}

      <div className="scroll-panel mt-5 flex-1 min-h-0 overflow-auto">
        {!summary && !loading && dayLogs.length === 0 && (
          <EmptyState
            title="No log entries for this day."
            sub="Log sessions from the Dashboard, then come here to generate a report."
          />
        )}

        {!summary && !loading && dayLogs.length > 0 && (
          <EmptyState
            title={`${dayLogs.length} log ${dayLogs.length === 1 ? "entry" : "entries"} ready.`}
            sub="Click Generate report to create student summaries."
          />
        )}

        {summary && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-card px-5 py-3">
              <p className="text-sm">{summary.overview}</p>
            </div>
            {summary.students.map((s, i) => (
              <StudentSummaryCard key={i} s={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Sparkle
        size={44}
        weight="thin"
        className="mb-3 text-muted-foreground/40"
      />
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
