"use client";

import { useMemo } from "react";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import type { SessionLogEntry, ParsedStudentData } from "@/lib/session-log";
import { RichLogText } from "./rich-log-text";

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function LogCard({ log }: { log: SessionLogEntry }) {
  const { students } = useStudents();
  const { subjects } = useSubjects();

  const topicById = useMemo(() => {
    const m = new Map<string, { code: string; title: string }>();
    for (const sub of subjects) for (const t of sub.topics) m.set(t.id, t);
    return m;
  }, [subjects]);

  const hasParsed = log.parsedData && log.parsedData.students.length > 0;

  return (
    <article className="overflow-hidden rounded-lg border border-border">
      <div className="bg-card px-4 py-3">
        <p className="text-sm text-foreground">
          <RichLogText text={log.rawText} />
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(log.createdAt)}
        </p>
      </div>
      {hasParsed && (
        <div className="space-y-2 border-t border-border bg-muted/40 px-4 py-2.5">
          {log.parsedData!.students.map((sd: ParsedStudentData) => {
            const student = students.find((st) => st.id === sd.studentId);
            return (
              <div key={sd.studentId} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-[var(--mention-student)]"
                  />
                  <span className="text-xs font-medium">
                    {student ? (
                      sd.studentName
                    ) : (
                      <span className="text-muted-foreground line-through">
                        {sd.studentName}
                      </span>
                    )}
                  </span>
                </div>
                {sd.notes.map((note, i) => (
                  <p
                    key={i}
                    className="border-l-2 border-border pl-3 text-xs text-muted-foreground"
                  >
                    {note}
                  </p>
                ))}
                {sd.testResults.map((r, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 pl-3 text-xs"
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
                  <div className="flex flex-wrap gap-1 pl-3">
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
            );
          })}
        </div>
      )}
    </article>
  );
}
