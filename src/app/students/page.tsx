"use client";

import { useState, useEffect } from "react";
import { useStudents, type Student } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useBreadcrumb } from "@/lib/breadcrumb";
import { SessionLogInput } from "@/components/session-log-input";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { DotsThreeVertical } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { UserCircle } from "@phosphor-icons/react/dist/ssr/UserCircle";
import { Notebook } from "@phosphor-icons/react/dist/ssr/Notebook";
import { Exam } from "@phosphor-icons/react/dist/ssr/Exam";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function StudentIcon({ icon, size = 14 }: { icon: string; size?: number }) {
  if (icon) {
    return <span style={{ fontSize: size * 1.5 }} className="leading-none">{icon}</span>;
  }
  return <UserCircle size={size * 2} className="text-muted-foreground/30" weight="thin" />;
}

// ═══════════════════════════════════════════════════════════
// ADD STUDENT DIALOG
// ═══════════════════════════════════════════════════════════

function AddStudentDialog({ open, onOpenChange, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; email: string; icon: string; subjectId: string; targetGrade: string; isRegular: boolean }) => void;
}) {
  const { subjects } = useSubjects();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [targetGrade, setTargetGrade] = useState("");

  const reset = () => { setName(""); setEmail(""); setSubjectId(""); setTargetGrade(""); };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), email: email.trim(), icon: "", subjectId, targetGrade: targetGrade.trim(), isRegular: false });
    reset();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add student</AlertDialogTitle>
          <AlertDialogDescription>Add a new student to your roster.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }} autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Target grade</label>
            <Input value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} placeholder="e.g. A*" className="text-sm" />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={!name.trim()}>Add</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ═══════════════════════════════════════════════════════════
// STUDENT DETAIL
// ═══════════════════════════════════════════════════════════

function StudentDetail({ student, onBack }: { student: Student; onBack: () => void }) {
  const { updateStudent, deleteStudent, deleteNote, deleteTestResult } = useStudents();
  const { subjects } = useSubjects();
  const { setSubtitle } = useBreadcrumb();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editEmail, setEditEmail] = useState(student.email);
  const [editRef, setEditRef] = useState(student.referenceNumber);
  const [editIcon, setEditIcon] = useState(student.icon);

  useEffect(() => {
    setSubtitle(student.name);
    return () => setSubtitle(null);
  }, [student.name, setSubtitle]);

  const subjectName = subjects.find(s => s.id === student.subjectId)?.name ?? "—";

  const handleEditSave = () => {
    const trimmedName = editName.trim();
    if (trimmedName) {
      updateStudent(student.id, {
        name: trimmedName,
        email: editEmail.trim(),
        referenceNumber: editRef.trim() || student.referenceNumber,
        icon: editIcon,
      });
    }
    setEditOpen(false);
  };

  const grades = [
    { label: "Current", value: student.currentGrade },
    { label: "Predicted", value: student.predictedGrade },
    { label: "Target", value: student.targetGrade },
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Back + header */}
      <div className="shrink-0">
        <button onClick={onBack}
          className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center shrink-0">
              <StudentIcon icon={student.icon} size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-medium tracking-tight">{student.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {student.referenceNumber} · {student.email || "No email"} · {student.completedSessions} session{student.completedSessions !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50 transition-all outline-none">
              <DotsThreeVertical size={18} weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditName(student.name); setEditEmail(student.email); setEditRef(student.referenceNumber); setEditIcon(student.icon); setEditOpen(true); }}>
                <PencilSimple size={14} /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash size={14} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 flex-1 min-h-0 overflow-auto space-y-5">
        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2 bg-muted/80 text-[10px] font-medium text-muted-foreground">Subject</div>
            <div className="px-4 py-2.5 bg-card text-sm">{subjectName}</div>
          </section>
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2 bg-muted/80 text-[10px] font-medium text-muted-foreground">Grades</div>
            <div className="bg-card flex divide-x divide-border/30">
              {grades.map(g => (
                <div key={g.label} className="flex-1 px-2 py-2.5 text-center">
                  <div className="text-[9px] text-muted-foreground/50">{g.label}</div>
                  <div className="text-sm font-medium">{g.value || "—"}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2 bg-muted/80 text-[10px] font-medium text-muted-foreground">Sessions</div>
            <div className="px-4 py-2.5 bg-card text-sm font-medium tabular-nums">{student.completedSessions}</div>
          </section>
        </div>

        {/* Session log input */}
        <SessionLogInput studentId={student.id} />

        {/* Notes */}
        {student.notes.length > 0 && (
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/80 flex items-center gap-2">
              <Notebook size={14} className="text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">Notes</span>
              <span className="text-[10px] text-muted-foreground/40 ml-auto">{student.notes.length}</span>
            </div>
            <div className="bg-card divide-y divide-border/20 max-h-60 overflow-auto">
              {student.notes.map(n => (
                <div key={n.id} className="group px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{n.content}</p>
                    <button onClick={() => deleteNote(student.id, n.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/30 hover:text-destructive transition-all shrink-0 mt-0.5">
                      <Trash size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{formatDate(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Test Results */}
        {student.testResults.length > 0 && (
          <section className="rounded-lg border border-border/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/80 flex items-center gap-2">
              <Exam size={14} className="text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">Test Results</span>
              <span className="text-[10px] text-muted-foreground/40 ml-auto">{student.testResults.length}</span>
            </div>
            <div className="bg-card divide-y divide-border/20 max-h-60 overflow-auto">
              {student.testResults.map(r => (
                <div key={r.id} className="group px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium truncate">{r.name}</span>
                      <span className="text-sm tabular-nums text-muted-foreground shrink-0">{r.scoreGot}/{r.scoreOf}</span>
                      <span className="text-xs text-muted-foreground/50 shrink-0">({Math.round((r.scoreGot / r.scoreOf) * 100)}%)</span>
                    </div>
                    <button onClick={() => deleteTestResult(student.id, r.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/30 hover:text-destructive transition-all shrink-0">
                      <Trash size={12} />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{formatDate(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-medium">{student.name}</span> and all their notes and test results will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { deleteStudent(student.id); onBack(); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit student</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon (emoji)</label>
              <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="e.g. 🎓" className="text-sm w-20" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); }} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Reference</label>
              <Input value={editRef} onChange={(e) => setEditRef(e.target.value)} className="text-sm font-mono" placeholder="ST-001" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="text-sm" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSave}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function StudentsPage() {
  const { students, addStudent } = useStudents();
  const { subjects } = useSubjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const selected = selectedId ? students.find(s => s.id === selectedId) : null;
  if (selected) {
    return <StudentDetail student={selected} onBack={() => setSelectedId(null)} />;
  }

  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

  const q = search.toLowerCase();
  const filtered = !q ? students : students.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.referenceNumber.toLowerCase().includes(q) ||
    s.email.toLowerCase().includes(q) ||
    (subjectMap.get(s.subjectId) ?? "").toLowerCase().includes(q)
  );

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your student roster.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} className="mr-1" /> Add Student
        </Button>
      </div>

      {students.length > 0 && (
        <div className="relative mt-5 shrink-0">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ref, email, or subject..." className="pl-8 h-8 text-sm" />
        </div>
      )}

      <div className="mt-4 flex-1 min-h-0 overflow-auto">
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle size={48} className="text-muted-foreground/20 mb-3" weight="thin" />
            <p className="text-sm text-muted-foreground/60">No students yet.</p>
            <p className="text-xs text-muted-foreground/40 mt-1">Click &ldquo;Add Student&rdquo; to get started.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground/40 py-8 text-center">No students match your search.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/80 border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 hidden sm:table-cell">Ref</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Subject</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Current</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Predicted</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Target</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2.5">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const subName = subjectMap.get(s.subjectId) ?? "—";
                  return (
                    <tr key={s.id}
                      className="border-b border-border/30 last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedId(s.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <StudentIcon icon={s.icon} size={8} />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground/50 sm:hidden">{s.referenceNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs font-mono text-muted-foreground/50">{s.referenceNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">{subName}</td>
                      <td className="px-3 py-3 text-center text-sm font-medium">{s.currentGrade || "—"}</td>
                      <td className="px-3 py-3 text-center text-sm font-medium">{s.predictedGrade || "—"}</td>
                      <td className="px-3 py-3 text-center text-sm font-medium">{s.targetGrade || "—"}</td>
                      <td className="px-3 py-3 text-center text-xs text-muted-foreground tabular-nums">{s.completedSessions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen}
        onSave={(data) => addStudent({
          ...data,
          currentGrade: "",
          predictedGrade: "",
        })}
      />
    </div>
  );
}
