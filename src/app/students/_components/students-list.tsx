"use client";

import { useMemo, useState } from "react";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Star } from "@phosphor-icons/react/dist/ssr/Star";
import { UserCircle } from "@phosphor-icons/react/dist/ssr/UserCircle";
import { useStudents, type Student } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "./student-avatar";
import { AddStudentDialog } from "./add-student-dialog";

export function StudentsList({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { students, addStudent, updateStudent } = useStudents();
  const { subjects } = useSubjects();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const subjectMap = useMemo(
    () => new Map(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = !q
      ? students
      : students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.referenceNumber.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (subjectMap.get(s.subjectId) ?? "").toLowerCase().includes(q),
        );
    return [...matched].sort((a, b) => {
      if (a.isStarred !== b.isStarred) return a.isStarred ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [students, subjectMap, search]);

  return (
    <div className="flex h-full flex-col p-4 sm:p-8">
      <header className="flex flex-col gap-4 shrink-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your student roster.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} className="mr-1" /> Add student
        </Button>
      </header>

      {students.length > 0 && (
        <div className="relative mt-5 shrink-0">
          <MagnifyingGlass
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reference, email, or subject…"
            aria-label="Search students"
            className="h-9 pl-8"
          />
        </div>
      )}

      <div className="scroll-panel mt-4 flex-1 min-h-0 overflow-auto">
        {students.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No students match your search.
          </p>
        ) : (
          <StudentsTable
            rows={filtered}
            subjectMap={subjectMap}
            onSelect={onSelect}
            onToggleStar={(s) => updateStudent(s.id, { isStarred: !s.isStarred })}
          />
        )}
      </div>

      <AddStudentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(data) =>
          addStudent({
            ...data,
            currentGrade: "",
            predictedGrade: "",
          })
        }
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <UserCircle size={48} weight="thin" className="mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No students yet.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Click &ldquo;Add student&rdquo; to get started.
      </p>
    </div>
  );
}

function StudentsTable({
  rows,
  subjectMap,
  onSelect,
  onToggleStar,
}: {
  rows: Student[];
  subjectMap: Map<string, string>;
  onSelect: (id: string) => void;
  onToggleStar: (s: Student) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Desktop table */}
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b border-border bg-muted/80 text-left">
            <Th className="pl-3">Name</Th>
            <Th>Ref</Th>
            <Th>Subject</Th>
            <Th className="text-center">Current</Th>
            <Th className="text-center">Predicted</Th>
            <Th className="text-center">Target</Th>
            <Th className="text-center pr-3">Sessions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.id}
              tabIndex={0}
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(s.id);
              }}
              className="cursor-pointer border-b border-border last:border-0 outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60"
            >
              <td className="py-3 pl-3">
                <div className="flex items-center gap-2.5">
                  <StarButton
                    active={s.isStarred}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(s);
                    }}
                  />
                  <StudentAvatar icon={s.icon} size={28} />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
              </td>
              <td className="py-3 font-mono text-xs text-muted-foreground">
                {s.referenceNumber}
              </td>
              <td className="py-3 text-sm text-muted-foreground truncate max-w-[220px]">
                {subjectMap.get(s.subjectId) ?? "—"}
              </td>
              <td className="py-3 text-center text-sm font-medium">
                {s.currentGrade || "—"}
              </td>
              <td className="py-3 text-center text-sm font-medium">
                {s.predictedGrade || "—"}
              </td>
              <td className="py-3 text-center text-sm font-medium">
                {s.targetGrade || "—"}
              </td>
              <td className="py-3 pr-3 text-center text-xs tabular-nums text-muted-foreground">
                {s.completedSessions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card list */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((s) => (
          <li
            key={s.id}
            tabIndex={0}
            onClick={() => onSelect(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(s.id);
            }}
            className="cursor-pointer outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60"
          >
            <div className="flex items-center gap-3 p-3">
              <StarButton
                active={s.isStarred}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(s);
                }}
              />
              <StudentAvatar icon={s.icon} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{s.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.referenceNumber}
                  </span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {subjectMap.get(s.subjectId) ?? "—"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {s.completedSessions} session
                  {s.completedSessions !== 1 ? "s" : ""}
                </span>
                {s.targetGrade && (
                  <span>
                    Target{" "}
                    <span className="font-medium text-foreground">
                      {s.targetGrade}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`py-2.5 text-xs font-medium text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function StarButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={active ? "Unstar" : "Star"}
      aria-pressed={active}
      className={`shrink-0 rounded-md p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
        active
          ? "text-warning"
          : "text-muted-foreground/40 hover:text-muted-foreground"
      }`}
    >
      <Star size={14} weight={active ? "fill" : "regular"} />
    </button>
  );
}
