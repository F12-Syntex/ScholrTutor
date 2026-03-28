"use client";

import { useState, useRef, useEffect } from "react";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { parseSessionLog, saveSessionLog, type ParsedSessionData } from "@/lib/session-log";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { Button } from "@/components/ui/button";

// ── Mention tracking ──

type MentionEntry = { type: "student" | "topic"; id: string; label: string };

// ── Trigger detection ──

type TriggerState =
  | { phase: "category"; query: string; start: number }
  | { phase: "items"; type: "student" | "topic"; query: string; start: number }
  | null;

function detectTrigger(text: string, pos: number): TriggerState {
  const before = text.slice(0, pos);

  const sm = before.match(/@student\(([^)@]*)$/);
  if (sm) return { phase: "items", type: "student", query: sm[1], start: pos - sm[0].length };

  const tm = before.match(/@topic\(([^)@]*)$/);
  if (tm) return { phase: "items", type: "topic", query: tm[1], start: pos - tm[0].length };

  // Bare @ not yet committed to a type
  const bare = before.match(/@([^@\s(]*)$/);
  if (bare) return { phase: "category", query: bare[1], start: pos - bare[0].length };

  return null;
}

// ── Component ──

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
  const [trigger, setTrigger] = useState<TriggerState>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const mentionMapRef = useRef(new Map<string, MentionEntry>());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Autocomplete items ──

  const categories = [
    { key: "student", label: "Student", icon: Users },
    { key: "topic", label: "Topic", icon: Books },
  ];

  type AutoItem = { id: string; label: string; sublabel: string };

  const items: AutoItem[] = trigger?.phase === "items" ? (() => {
    const q = trigger.query.toLowerCase();
    if (trigger.type === "student") {
      return students
        .filter(s => s.name.toLowerCase().includes(q) || s.referenceNumber.toLowerCase().includes(q))
        .slice(0, 6)
        .map(s => ({ id: s.id, label: s.name, sublabel: s.referenceNumber }));
    }
    let pool = subjects.flatMap(sub => sub.topics.map(t => ({ ...t, subName: sub.name })));
    if (studentId) {
      const st = students.find(s => s.id === studentId);
      if (st?.subjectId) {
        const scoped = subjects.find(s => s.id === st.subjectId);
        if (scoped) pool = scoped.topics.map(t => ({ ...t, subName: scoped.name }));
      }
    }
    return pool
      .filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
      .slice(0, 6)
      .map(t => ({ id: t.id, label: `${t.code} ${t.title}`, sublabel: t.subName }));
  })() : [];

  const filteredCategories = trigger?.phase === "category"
    ? categories.filter(c => c.label.toLowerCase().includes(trigger.query.toLowerCase()))
    : [];

  const totalItems = trigger?.phase === "category" ? filteredCategories.length : items.length;

  // ── Cursor + trigger detection ──

  const refreshTrigger = () => {
    const el = textareaRef.current;
    if (!el) return;
    const t = detectTrigger(text, el.selectionStart);
    setTrigger(t);
    setSelectedIdx(0);
  };

  // ── Selection handlers ──

  const selectCategory = (key: string) => {
    if (!trigger || !textareaRef.current) return;
    const el = textareaRef.current;
    const before = text.slice(0, trigger.start);
    const after = text.slice(el.selectionStart);
    const insert = `@${key}(`;
    const newText = before + insert + after;
    setText(newText);
    setTrigger(null);
    setTimeout(() => {
      const pos = before.length + insert.length;
      el.focus();
      el.setSelectionRange(pos, pos);
      // Re-detect to enter items phase
      const t = detectTrigger(newText, pos);
      setTrigger(t);
      setSelectedIdx(0);
    }, 0);
  };

  const selectItem = (item: AutoItem) => {
    if (!trigger || trigger.phase !== "items" || !textareaRef.current) return;
    const el = textareaRef.current;
    const before = text.slice(0, trigger.start);
    const after = text.slice(el.selectionStart);
    const token = `@${trigger.type}(${item.label})`;
    const newText = before + token + " " + after;
    setText(newText);

    // Track mention by ID
    mentionMapRef.current.set(token, { type: trigger.type, id: item.id, label: item.label });

    setTrigger(null);
    setTimeout(() => {
      const pos = before.length + token.length + 1;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  // ── Keyboard nav ──

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (trigger && totalItems > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, totalItems - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (trigger.phase === "category") selectCategory(filteredCategories[selectedIdx].key);
        else selectItem(items[selectedIdx]);
        return;
      }
      if (e.key === "Escape") { setTrigger(null); return; }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); }
  };

  // ── Submit ──

  const handleSubmit = async () => {
    if (!text.trim() || stage !== "idle") return;
    if (!settings.openRouterApiKey) { setError("No API key. Go to Settings."); return; }
    setStage("submitting");
    setError("");
    try {
      const result = await parseSessionLog(text, students, subjects, settings.openRouterApiKey, settings.aiModel);
      if (result.students.length === 0) {
        if (studentId) {
          addNote(studentId, text.trim());
          saveSessionLog({ id: crypto.randomUUID(), rawText: text, parsedData: null, createdAt: new Date().toISOString() });
          setText("");
          mentionMapRef.current.clear();
          setStage("idle");
          onLogSubmitted?.();
          return;
        }
        throw new Error("No students identified. Type @ to mention a student.");
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
    mentionMapRef.current.clear();
    setParsed(null);
    setStage("idle");
    onLogSubmitted?.();
  };

  // ── Auto-resize ──

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  // Reset trigger when text changes externally
  useEffect(() => { if (!text) setTrigger(null); }, [text]);

  const showDropdown = trigger && totalItems > 0;

  return (
    <div className="rounded-lg border border-border/50 overflow-visible relative">
      {/* Dropdown — positioned ABOVE the component */}
      {showDropdown && (
        <div className="absolute left-0 right-0 bottom-full mb-1 z-50">
          <div className="mx-3 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            {trigger.phase === "category" ? (
              filteredCategories.map((c, i) => (
                <button
                  key={c.key}
                  onMouseDown={(e) => { e.preventDefault(); selectCategory(c.key); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors ${
                    i === selectedIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                >
                  <c.icon size={15} className="text-muted-foreground/60 shrink-0" />
                  <span>{c.label}</span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto">@{c.key}()</span>
                </button>
              ))
            ) : (
              items.map((item, i) => (
                <button
                  key={item.id}
                  onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
                    i === selectedIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">{item.sublabel}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-card rounded-t-lg">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(e.target); }}
          onKeyUp={refreshTrigger}
          onClick={refreshTrigger}
          onKeyDown={handleKeyDown}
          placeholder={studentId
            ? "Log a session... type @ to mention topics. Ctrl+Enter to submit."
            : "Log a session... type @ to mention students or topics."
          }
          className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground/40 min-h-[72px]"
          disabled={stage !== "idle"}
        />
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
      <div className="px-4 py-2 border-t border-border/20 flex items-center justify-between rounded-b-lg bg-muted/40">
        <span className="text-[10px] text-muted-foreground/40">
          Type <kbd className="px-1 py-0.5 rounded border border-border/50 bg-background/80 font-mono text-[9px]">@</kbd> to mention · Ctrl+Enter to submit
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
            <Button variant="ghost" size="xs" onClick={() => { setParsed(null); setStage("idle"); }}>
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
