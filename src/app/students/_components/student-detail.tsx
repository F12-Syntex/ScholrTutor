"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { DotsThreeVertical } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { Notebook } from "@phosphor-icons/react/dist/ssr/Notebook";
import { Exam } from "@phosphor-icons/react/dist/ssr/Exam";
import { Star } from "@phosphor-icons/react/dist/ssr/Star";
import { useStudents, type Student } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useBreadcrumb } from "@/lib/breadcrumb";
import { SessionLogInput } from "@/components/session-log-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StudentAvatar } from "./student-avatar";
import { EditStudentDialog } from "./edit-student-dialog";
import { ConfirmDialog } from "./confirm-dialog";

/**
 * Uncontrolled-ish grade input. Keeps its own local state while the user
 * types, commits to the provider on blur or Enter. Prevents typing lag
 * from the students-context re-render cascade firing on every keystroke.
 */
function GradeInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const committedRef = useRef(value);

  useEffect(() => {
    setLocal(value);
    committedRef.current = value;
  }, [value]);

  const commit = () => {
    if (local === committedRef.current) return;
    committedRef.current = local;
    onCommit(local);
  };

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder="—"
      aria-label={`${label} grade`}
      className="w-full border-b border-transparent bg-transparent text-center text-sm font-medium outline-none transition-colors hover:border-border focus:border-primary placeholder:text-muted-foreground/40"
    />
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function StudentDetail({
  student,
  onBack,
}: {
  student: Student;
  onBack: () => void;
}) {
  const { updateStudent, deleteStudent, deleteNote, deleteTestResult } = useStudents();
  const { subjects } = useSubjects();
  const { setSubtitle } = useBreadcrumb();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  useEffect(() => {
    setSubtitle(student.name);
    return () => setSubtitle(null);
  }, [student.name, setSubtitle]);

  const subject = useMemo(
    () => subjects.find((s) => s.id === student.subjectId),
    [subjects, student.subjectId],
  );

  const grades = [
    { label: "Current", value: student.currentGrade, key: "currentGrade" as const },
    {
      label: "Predicted",
      value: student.predictedGrade,
      key: "predictedGrade" as const,
    },
    { label: "Target", value: student.targetGrade, key: "targetGrade" as const },
  ];

  return (
    <div className="flex h-full flex-col p-4 sm:p-8">
      {/* Back + header */}
      <div className="shrink-0">
        <button
          onClick={onBack}
          className="group mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:text-foreground"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <StudentAvatar icon={student.icon} size={56} />
              <button
                onClick={() =>
                  updateStudent(student.id, { isStarred: !student.isStarred })
                }
                aria-label={student.isStarred ? "Unstar" : "Star"}
                aria-pressed={student.isStarred}
                className={`absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                  student.isStarred
                    ? "bg-warning text-warning-foreground"
                    : "bg-muted text-muted-foreground/40 hover:bg-accent hover:text-foreground"
                }`}
              >
                <Star
                  size={12}
                  weight={student.isStarred ? "fill" : "regular"}
                />
              </button>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-medium tracking-tight">
                {student.name}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className="font-mono text-xs">{student.referenceNumber}</span>
                <span aria-hidden>·</span>
                {student.email ? (
                  <a
                    href={`mailto:${student.email}`}
                    className="hover:underline"
                  >
                    {student.email}
                  </a>
                ) : (
                  <span>No email</span>
                )}
                <span aria-hidden>·</span>
                <span>
                  {student.completedSessions} session
                  {student.completedSessions !== 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {student.email && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Email student"
                render={
                  <a
                    href={`mailto:${student.email}?subject=${encodeURIComponent(`Session Notes - ${student.name}`)}`}
                  />
                }
              >
                <EnvelopeSimple size={16} />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More actions"
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <DotsThreeVertical size={18} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <PencilSimple size={14} /> Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete student"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="scroll-panel mt-6 flex-1 min-h-0 space-y-5 overflow-auto">
        {/* Summary row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="bg-muted/80 px-4 py-2 text-xs font-medium text-muted-foreground">
              Subject
            </div>
            <div className="bg-card px-4 py-2.5 text-sm">
              {subject ? (
                <Link
                  href={`/subjects?id=${subject.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {subject.name}
                </Link>
              ) : (
                "—"
              )}
            </div>
          </section>
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="bg-muted/80 px-4 py-2 text-xs font-medium text-muted-foreground">
              Grades
            </div>
            <div className="flex divide-x divide-border bg-card">
              {grades.map((g) => (
                <div key={g.label} className="flex-1 px-2 py-2 text-center">
                  <div className="mb-0.5 text-[10px] text-muted-foreground">
                    {g.label}
                  </div>
                  <GradeInput
                    label={g.label}
                    value={g.value}
                    onCommit={(v) =>
                      updateStudent(student.id, { [g.key]: v })
                    }
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="bg-muted/80 px-4 py-2 text-xs font-medium text-muted-foreground">
              Sessions
            </div>
            <div className="bg-card px-4 py-2.5 text-sm font-medium tabular-nums">
              {student.completedSessions}
            </div>
          </section>
        </div>

        {/* Session log input */}
        <SessionLogInput studentId={student.id} />

        {/* Notes */}
        {student.notes.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-2 bg-muted/80 px-4 py-2.5">
              <Notebook size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Notes
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {student.notes.length}
              </span>
            </div>
            <ul className="divide-y divide-border bg-card">
              {student.notes.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setDeleteNoteId(n.id)}
                    aria-label="Delete note"
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash size={12} className="mr-1" /> Delete
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Test Results */}
        {student.testResults.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-2 bg-muted/80 px-4 py-2.5">
              <Exam size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Test Results
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {student.testResults.length}
              </span>
            </div>
            <ul className="divide-y divide-border bg-card">
              {student.testResults.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate text-sm font-medium">
                        {r.name}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {r.scoreGot}/{r.scoreOf}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        ({Math.round((r.scoreGot / r.scoreOf) * 100)}%)
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setDeleteTestId(r.id)}
                    aria-label="Delete test result"
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash size={12} className="mr-1" /> Delete
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <EditStudentDialog
        student={student}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={(data) => updateStudent(student.id, data)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student?"
        description={
          <>
            <span className="font-medium text-foreground">{student.name}</span>{" "}
            and all their notes and test results will be permanently removed.
          </>
        }
        onConfirm={() => {
          deleteStudent(student.id);
          onBack();
        }}
      />

      <ConfirmDialog
        open={!!deleteNoteId}
        onOpenChange={(v) => !v && setDeleteNoteId(null)}
        title="Delete note?"
        description="This note will be permanently removed."
        onConfirm={() => {
          if (deleteNoteId) deleteNote(student.id, deleteNoteId);
          setDeleteNoteId(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTestId}
        onOpenChange={(v) => !v && setDeleteTestId(null)}
        title="Delete test result?"
        description="This test result will be permanently removed."
        onConfirm={() => {
          if (deleteTestId) deleteTestResult(student.id, deleteTestId);
          setDeleteTestId(null);
        }}
      />
    </div>
  );
}
