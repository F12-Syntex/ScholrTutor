"use client";

import { useState, useRef, useCallback } from "react";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { parseSessionLog, extractMentions, saveSessionLog, type ParsedSessionData } from "@/lib/session-log";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { Button } from "@/components/ui/button";

type AutoItem = { id: string; label: string; sublabel: string };
type Trigger = { type: "student" | "topic"; query: string; start: number } | null;

function detectTrigger(text: string, pos: number): Trigger {
  const before = text.slice(0, pos);
  const sm = before.match(/@student:([^@\n]*)$/);
  if (sm) return { type: "student", query: sm[1], start: pos - sm[0].length };
  const tm = before.match(/@topic:([^@\n]*)$/);
  if (tm) return { type: "topic", query: tm[1], start: pos - tm[0].length };
  return null;
}

export function SessionLogInput({ studentId, onLogSubmitted }: {
  studentId?: string;
  onLogSubmitted?: () => void;
}) {
  const { students, addNote, addTestResult, updateStudent } = useStudents();
  const { subjects } = useSubjects();
  const { settings } = useSettings();

  const [text, setText] = useState("");
  const [stage, setStage] = useState<"idle" | "submitting" | "review">("idle");
  const [parsed, setParsed] = useState<ParsedSessionData | null>(null);
  const [error, setError] = useState("");
  const [trigger, setTrigger] = useState<Trigger>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build autocomplete items
  const items: AutoItem[] = trigger ? (() => {
    const q = trigger.query.toLowerCase();
    if (trigger.type === "student") {
      return students
        .filter(s => s.name.toLowerCase().includes(q) || s.referenceNumber.toLowerCase().includes(q))
        .slice(0, 8)
        .map(s => ({ id: s.id, label: s.name, sublabel: s.referenceNumber }));
    }
    // Scope topics to student's subject if on student page
    let topicPool = subjects.flatMap(sub => sub.topics.map(t => ({ ...t, subName: sub.name })));
    if (studentId) {
      const st = students.find(s => s.id === studentId);
      if (st?.subjectId) {
        const scoped = subjects.find(s => s.id === st.subjectId);
        if (scoped) topicPool = scoped.topics.map(t => ({ ...t, subName: scoped.name }));
      }
    }
    return topicPool
      .filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
      .slice(0, 8)
      .map(t => ({ id: t.id, label: `${t.code} ${t.title}`, sublabel: t.subName }));
  })() : [];

  const handleChange = useCallback((val: string) => {
    setText(val);
    // Trigger detection will run on next cursor event
  }, []);

  const handleCursorChange = () => {
    const el = textareaRef.current;
    if (!el) return;
    const t = detectTrigger(text, el.selectionStart);
    setTrigger(t);
    setSelectedIdx(0);
  };

  const selectItem = (item: AutoItem) => {
    if (!trigger || !textareaRef.current) return;
    const el = textareaRef.current;
    const before = text.slice(0, trigger.start);
    const after = text.slice(el.selectionStart);
    const token = `@${trigger.type}:${item.label} `;
    const newText = before + token + after;
    setText(newText);
    setTrigger(null);
    setTimeout(() => {
      const pos = before.length + token.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (trigger && items.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, items.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); selectItem(items[selectedIdx]); return; }
      if (e.key === "Escape") { setTrigger(null); return; }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  };

  const handleSubmit = async () => {
    if (!text.trim() || stage !== "idle") return;
    if (!settings.openRouterApiKey) { setError("No API key. Go to Settings."); return; }
    setStage("submitting");
    setError("");
    try {
      const result = await parseSessionLog(text, students, subjects, settings.openRouterApiKey, settings.aiModel);
      if (result.students.length === 0) {
        // No structured data extracted — save as raw note for the student if on student page
        if (studentId) {
          addNote(studentId, text.trim());
          saveSessionLog({ id: crypto.randomUUID(), rawText: text, parsedData: null, createdAt: new Date().toISOString() });
          setText("");
          setStage("idle");
          onLogSubmitted?.();
          return;
        }
        throw new Error("Could not identify any students in the log. Use @student: to mention them.");
      }
      setParsed(result);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse.");
      setStage("idle");
    }
  };

  const handleConfirm = () => {
    if (!parsed) return;
    for (const sd of parsed.students) {
      const student = students.find(s => s.id === sd.studentId);
      if (!student) continue;
      for (const note of sd.notes) addNote(sd.studentId, note);
      for (const tr of sd.testResults) addTestResult(sd.studentId, tr);
      if (sd.incrementSession) updateStudent(sd.studentId, { completedSessions: student.completedSessions + 1 });
    }
    saveSessionLog({ id: crypto.randomUUID(), rawText: text, parsedData: parsed, createdAt: new Date().toISOString() });
    setText("");
    setParsed(null);
    setStage("idle");
    onLogSubmitted?.();
  };

  const handleCancel = () => { setParsed(null); setStage("idle"); };

  // Auto-resize textarea
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-muted/80 text-xs font-medium text-muted-foreground">Session Log</div>

      {/* Input area */}
      <div className="relative bg-card">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { handleChange(e.target.value); autoResize(e.target); }}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          onKeyDown={handleKeyDown}
          placeholder={studentId
            ? "Log a session... e.g. We covered @topic: and did a test, got 18/25"
            : "Log a session... e.g. @student:Name was focused today, we covered @topic: ..."
          }
          className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 min-h-[72px]"
          disabled={stage !== "idle"}
        />

        {/* Autocomplete dropdown */}
        {trigger && items.length > 0 && (
          <div className="absolute left-4 right-4 bottom-0 translate-y-full z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden max-h-52 overflow-auto">
            {items.map((item, i) => (
              <button
                key={item.id}
                onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
                  i === selectedIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  trigger.type === "student" ? "bg-[var(--mention-student)]/15 text-[var(--mention-student)]" : "bg-[var(--mention-topic)]/15 text-[var(--mention-topic)]"
                }`}>
                  {trigger.type === "student" ? "@" : "#"}
                </span>
                <span className="truncate">{item.label}</span>
                <span className="text-xs text-muted-foreground/50 ml-auto shrink-0">{item.sublabel}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/5 border-t border-destructive/10">{error}</div>
      )}

      {/* Review panel */}
      {stage === "review" && parsed && (
        <div className="border-t border-border/20 px-4 py-3 bg-muted/30 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">AI extracted:</p>
          {parsed.students.map(sd => (
            <div key={sd.studentId} className="text-xs space-y-0.5">
              <span className="font-medium">{sd.studentName}</span>
              {sd.notes.length > 0 && <p className="text-muted-foreground">{sd.notes.length} note{sd.notes.length > 1 ? "s" : ""}</p>}
              {sd.testResults.length > 0 && (
                <p className="text-muted-foreground">
                  {sd.testResults.map(r => `${r.name}: ${r.scoreGot}/${r.scoreOf}`).join(", ")}
                </p>
              )}
              {sd.incrementSession && <p className="text-muted-foreground">+1 session</p>}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/40">
          @student: and @topic: to mention · Ctrl+Enter to submit
        </span>
        {stage === "idle" && (
          <Button variant="outline" size="xs" onClick={handleSubmit} disabled={!text.trim()}>
            <PaperPlaneRight size={12} className="mr-1" /> Submit
          </Button>
        )}
        {stage === "submitting" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleNotch size={12} className="animate-spin" /> Processing...
          </div>
        )}
        {stage === "review" && (
          <div className="flex gap-1.5">
            <Button variant="ghost" size="xs" onClick={handleCancel}>
              <X size={12} className="mr-1" /> Cancel
            </Button>
            <Button size="xs" onClick={handleConfirm}>
              <Check size={12} className="mr-1" /> Confirm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
