"use client";

import { useSubjects, type Subject } from "@/lib/subjects";
import { SubjectActions } from "./subject-actions";

export function SubjectRow({
  subject,
  onClick,
}: {
  subject: Subject;
  onClick: () => void;
}) {
  const { deleteSubject } = useSubjects();

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/60 px-4 py-3 outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{subject.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{subject.examBoard}</span>
          <span aria-hidden>·</span>
          <span>{subject.level}</span>
          <span aria-hidden>·</span>
          <span>{subject.topics.length} topics</span>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <SubjectActions
          subject={subject}
          onDelete={() => deleteSubject(subject.id)}
        />
      </div>
    </div>
  );
}
