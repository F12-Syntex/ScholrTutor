"use client";

import { useState, useEffect, useMemo } from "react";
import { useStudents, type Student } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import {
  loadSessionLogs,
  SESSION_SLOTS,
  formatSlotTime,
  toDateKey,
  type SessionLogEntry,
} from "@/lib/session-log";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Button } from "@/components/ui/button";

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

// ── Build context for AI ──

function buildDayContext(
  dayLogs: SessionLogEntry[],
  students: Student[],
  subjects: ReturnType<typeof useSubjects>["subjects"],
): string {
  const lines: string[] = [];
  const allTopics = subjects.flatMap(s => s.topics);

  const slotGroups: SessionLogEntry[][] = SESSION_SLOTS.map(() => []);
  for (const log of dayLogs) {
    const slot = log.sessionSlot ?? 0;
    if (slot >= 0 && slot < slotGroups.length) slotGroups[slot].push(log);
  }

  for (let i = 0; i < SESSION_SLOTS.length; i++) {
    const logs = slotGroups[i];
    if (logs.length === 0) continue;
    lines.push(`\n## ${SESSION_SLOTS[i].label} (${formatSlotTime(i)})`);
    for (const log of logs) {
      lines.push(`\nEntry: "${log.rawText}"`);
      if (log.parsedData) {
        for (const sd of log.parsedData.students) {
          const student = students.find(s => s.id === sd.studentId);
          lines.push(`  Student: ${sd.studentName}${student ? ` (${student.referenceNumber})` : ""}`);
          if (student) {
            const sub = subjects.find(s => s.id === student.subjectId);
            if (sub) lines.push(`    Subject: ${sub.name}`);
            lines.push(`    Grades — Current: ${student.currentGrade || "N/A"}, Predicted: ${student.predictedGrade || "N/A"}, Target: ${student.targetGrade || "N/A"}`);
          }
          for (const note of sd.notes) lines.push(`    Note: ${note}`);
          for (const tr of sd.testResults) lines.push(`    Test: ${tr.name} — ${tr.scoreGot}/${tr.scoreOf} (${Math.round((tr.scoreGot / tr.scoreOf) * 100)}%)`);
          for (const tid of sd.topicIds) {
            const topic = allTopics.find(t => t.id === tid);
            if (topic) lines.push(`    Topic covered: ${topic.code} ${topic.title}`);
          }
        }
      }
    }
  }
  return lines.join("\n");
}

// ── AI types ──

interface StudentSummary {
  name: string;
  reference: string;
  subject: string;
  currentGrade: string;
  predictedGrade: string;
  targetGrade: string;
  topicsCovered: string[];
  testResults: { name: string; score: string; percentage: string }[];
  notes: string[];
  overallComment: string;
}

interface DaySummary {
  overview: string;
  students: StudentSummary[];
}

async function generateSummary(context: string, apiKey: string, model: string): Promise<DaySummary> {
  const systemPrompt = `You write tutoring daily reports. Given a day's session logs, produce a structured student-by-student summary.

Return ONLY valid JSON:
{
  "overview": "<1-2 sentence day overview>",
  "students": [
    {
      "name": "<student name>",
      "reference": "<reference number e.g. ST-001>",
      "subject": "<subject name>",
      "currentGrade": "<grade or empty>",
      "predictedGrade": "<grade or empty>",
      "targetGrade": "<grade or empty>",
      "topicsCovered": ["<topic code + title>"],
      "testResults": [{"name":"<test>","score":"<got>/<total>","percentage":"<n>%"}],
      "notes": ["<observation>"],
      "overallComment": "<brief progress comment>"
    }
  ]
}

Rules:
- Include every student mentioned in the logs
- Include reference numbers if available
- List ALL topics covered and ALL test results
- For test results, always include name, score fraction, and percentage
- Notes should be concise observations
- overallComment is a 1-2 sentence progress summary
- Grades should reflect what's in the data`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the daily student summary:\n${context}` },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return valid JSON");
  return JSON.parse(match[0]) as DaySummary;
}

// ── Student summary table ──

function StudentTable({ s }: { s: StudentSummary }) {
  const hasTopics = s.topicsCovered.length > 0;
  const hasTests = s.testResults.length > 0;
  const hasNotes = s.notes.length > 0;
  const hasRows = hasTopics || hasTests;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-muted/80">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{s.name}</span>
            {s.reference && <span className="text-xs font-mono text-muted-foreground/50">({s.reference})</span>}
          </div>
          {s.subject && <span className="text-xs text-muted-foreground/60">{s.subject}</span>}
        </div>
        {/* Grades row */}
        {(s.currentGrade || s.predictedGrade || s.targetGrade) && (
          <div className="flex gap-4 mt-1.5 text-[10px] text-muted-foreground/50">
            {s.currentGrade && <span>Current: <span className="font-medium text-foreground/70">{s.currentGrade}</span></span>}
            {s.predictedGrade && <span>Predicted: <span className="font-medium text-foreground/70">{s.predictedGrade}</span></span>}
            {s.targetGrade && <span>Target: <span className="font-medium text-foreground/70">{s.targetGrade}</span></span>}
          </div>
        )}
      </div>

      {/* Unified table: topics + tests */}
      {hasRows && (
        <table className="w-full bg-card">
          <thead>
            <tr className="border-b border-border/30 text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              <th className="text-left px-5 py-2 w-20">Type</th>
              <th className="text-left px-3 py-2">Detail</th>
              <th className="text-right px-5 py-2 w-28">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/15">
            {s.topicsCovered.map((t, j) => (
              <tr key={`t-${j}`}>
                <td className="px-5 py-2">
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--mention-topic)_15%,transparent)] text-[var(--mention-topic)]">Topic</span>
                </td>
                <td className="px-3 py-2 text-sm text-foreground/80">{t}</td>
                <td className="px-5 py-2 text-right text-xs text-muted-foreground/50">Covered</td>
              </tr>
            ))}
            {s.testResults.map((r, j) => (
              <tr key={`r-${j}`}>
                <td className="px-5 py-2">
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--mention-student)_15%,transparent)] text-[var(--mention-student)]">Test</span>
                </td>
                <td className="px-3 py-2 text-sm text-foreground/80">{r.name}</td>
                <td className="px-5 py-2 text-right">
                  <span className="text-sm font-medium tabular-nums">{r.score}</span>
                  <span className="text-xs text-muted-foreground/50 ml-1.5">({r.percentage})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Notes + comment */}
      <div className="bg-card border-t border-border/20 px-5 py-3 space-y-3">
        {hasNotes && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1.5">Notes</p>
            <div className="space-y-1">
              {s.notes.map((n, j) => (
                <p key={j} className="text-xs text-muted-foreground pl-2 border-l-2 border-border/30">{n}</p>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-foreground/70 italic">{s.overallComment}</p>
      </div>
    </div>
  );
}

// ── Page ──

export default function SummaryPage() {
  const { students } = useStudents();
  const { subjects } = useSubjects();
  const { settings } = useSettings();
  const [allLogs, setAllLogs] = useState<SessionLogEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setAllLogs(loadSessionLogs()); }, []);

  const dateKey = toDateKey(selectedDate);
  const dayLogs = useMemo(() =>
    allLogs.filter(l => toDateKey(new Date(l.createdAt)) === dateKey),
    [allLogs, dateKey]
  );

  useEffect(() => { setSummary(null); setError(""); }, [dateKey]);

  const handleGenerate = async () => {
    if (dayLogs.length === 0) return;
    if (!settings.openRouterApiKey) { setError("No API key. Go to Settings."); return; }
    setLoading(true);
    setError("");
    try {
      const context = buildDayContext(dayLogs, students, subjects);
      const result = await generateSummary(context, settings.openRouterApiKey, settings.aiModel);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
  const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
  const isToday = dateKey === toDateKey(new Date());

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="shrink-0">
        <h1 className="text-3xl font-medium tracking-tight">Student Summary</h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-generated daily reports, student by student.</p>
      </div>

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
        <span className="text-xs text-muted-foreground/40 ml-auto mr-3">
          {dayLogs.length} {dayLogs.length === 1 ? "entry" : "entries"}
        </span>
        <Button size="sm" onClick={handleGenerate} disabled={loading || dayLogs.length === 0}>
          {loading ? (
            <><CircleNotch size={14} className="mr-1.5 animate-spin" /> Generating...</>
          ) : (
            <><Sparkle size={14} className="mr-1.5" /> Generate Report</>
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive shrink-0">{error}</div>
      )}

      <div className="mt-5 flex-1 min-h-0 overflow-auto">
        {!summary && !loading && dayLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkle size={48} className="text-muted-foreground/15 mb-3" weight="thin" />
            <p className="text-sm text-muted-foreground/50">No log entries for this day.</p>
            <p className="text-xs text-muted-foreground/30 mt-1">Log sessions from the Dashboard, then come here to generate a report.</p>
          </div>
        )}

        {!summary && !loading && dayLogs.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkle size={48} className="text-muted-foreground/15 mb-3" weight="thin" />
            <p className="text-sm text-muted-foreground/50">{dayLogs.length} log {dayLogs.length === 1 ? "entry" : "entries"} ready.</p>
            <p className="text-xs text-muted-foreground/30 mt-1">Click Generate Report to create student summaries.</p>
          </div>
        )}

        {summary && (
          <div className="space-y-5">
            {/* Overview */}
            <div className="rounded-lg border border-border/50 bg-card px-5 py-3">
              <p className="text-sm text-foreground/80">{summary.overview}</p>
            </div>

            {/* Student tables */}
            {summary.students.map((s, i) => (
              <StudentTable key={i} s={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
