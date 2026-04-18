"use client";

import { useMemo } from "react";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";

export function RichLogText({ text }: { text: string }) {
  const { students } = useStudents();
  const { subjects } = useSubjects();

  const studentByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) m.set(s.name.toLowerCase(), s.name);
    return m;
  }, [students]);

  const topicByLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const sub of subjects) {
      for (const t of sub.topics) {
        m.set(`${t.code} ${t.title}`.toLowerCase(), `${t.code} ${t.title}`);
        m.set(t.code.toLowerCase(), `${t.code} ${t.title}`);
      }
    }
    return m;
  }, [subjects]);

  const parts: React.ReactNode[] = [];
  const regex = /@(student|topic)\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const type = match[1] as "student" | "topic";
    const label = match[2];
    const resolved =
      type === "student"
        ? studentByName.get(label.toLowerCase())
        : topicByLabel.get(label.toLowerCase()) ??
          topicByLabel.get(label.split(" ")[0].toLowerCase());
    parts.push(
      <span
        key={match.index}
        className="mention-chip"
        data-mention-type={resolved ? type : "deleted"}
      >
        {resolved ?? "[deleted]"}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <span className="whitespace-pre-wrap">{parts}</span>;
}
