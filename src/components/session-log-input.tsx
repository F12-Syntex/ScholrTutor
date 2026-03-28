"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

type MentionEntry = { type: "student" | "topic"; id: string; label: string };

type TriggerState =
  | { phase: "category"; query: string; start: number }
  | { phase: "items"; type: "student" | "topic"; query: string; start: number }
  | null;

type AutoItem = { id: string; label: string; sublabel: string };

function detectTriggerInNode(text: string, pos: number): TriggerState {
  const before = text.slice(0, pos);
  const sm = before.match(/@student\(([^)@]*)$/);
  if (sm) return { phase: "items", type: "student", query: sm[1], start: pos - sm[0].length };
  const tm = before.match(/@topic\(([^)@]*)$/);
  if (tm) return { phase: "items", type: "topic", query: tm[1], start: pos - tm[0].length };
  const bare = before.match(/@([^@\s(]*)$/);
  if (bare) return { phase: "category", query: bare[1], start: pos - bare[0].length };
  return null;
}

// Extract structured text + mention IDs from the contentEditable DOM
function extractContent(el: HTMLElement): { text: string; mentions: MentionEntry[] } {
  const mentions: MentionEntry[] = [];
  let text = "";
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node instanceof HTMLElement && node.dataset.mentionType) {
      const type = node.dataset.mentionType as "student" | "topic";
      const id = node.dataset.mentionId || "";
      const label = node.textContent || "";
      text += `@${type}(${label})`;
      mentions.push({ type, id, label });
    } else if (node instanceof HTMLElement && node.tagName === "BR") {
      text += "\n";
    } else if (node instanceof HTMLElement) {
      // Handle divs/spans that browsers insert for newlines
      text += "\n" + (node.textContent || "");
    }
  }
  return { text: text.trim(), mentions };
}

export function SessionLogInput({ studentId, onLogSubmitted }: {
  studentId?: string;
  onLogSubmitted?: () => void;
}) {
  const { students, addNote, addTestResult, updateStudent } = useStudents();
  const { subjects } = useSubjects();
  const { settings } = useSettings();

  const [stage, setStage] = useState<"idle" | "submitting" | "review">("idle");
  const [parsed, setParsed] = useState<ParsedSessionData | null>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [trigger, setTrigger] = useState<TriggerState>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Autocomplete data ──

  const categories = [
    { key: "student", label: "Student", icon: Users },
    { key: "topic", label: "Topic", icon: Books },
  ];

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

  // ── Trigger detection from DOM ──

  const refreshTrigger = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) { setTrigger(null); return; }
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) { setTrigger(null); return; }
    const t = detectTriggerInNode(node.textContent || "", sel.anchorOffset);
    setTrigger(t);
    setSelectedIdx(0);
  }, []);

  // ── DOM manipulation for mentions ──

  const replaceTextAndInsertMention = (type: "student" | "topic", id: string, label: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || "";
    const cursorPos = sel.anchorOffset;
    const before = text.slice(0, cursorPos);

    // Find trigger start
    const match = before.match(/@(?:student|topic)\([^)@]*$/) || before.match(/@[^@\s(]*$/);
    if (!match) return;
    const triggerStart = cursorPos - match[0].length;

    const beforeText = text.slice(0, triggerStart);
    const afterText = text.slice(cursorPos);
    const parent = node.parentNode!;

    // Build new nodes
    const frag = document.createDocumentFragment();
    if (beforeText) frag.appendChild(document.createTextNode(beforeText));

    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.className = "mention-chip";
    chip.dataset.mentionType = type;
    chip.dataset.mentionId = id;
    chip.textContent = label;
    frag.appendChild(chip);

    const afterNode = document.createTextNode("\u00A0" + afterText); // non-breaking space for cursor
    frag.appendChild(afterNode);

    parent.replaceChild(frag, node);

    // Move cursor after the space
    const range = document.createRange();
    range.setStart(afterNode, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    setTrigger(null);
  };

  const replaceTextWithPrefix = (key: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || "";
    const cursorPos = sel.anchorOffset;
    const before = text.slice(0, cursorPos);
    const match = before.match(/@[^@\s(]*$/);
    if (!match) return;

    const triggerStart = cursorPos - match[0].length;
    const prefix = `@${key}(`;
    node.textContent = text.slice(0, triggerStart) + prefix + text.slice(cursorPos);

    const newPos = triggerStart + prefix.length;
    const range = document.createRange();
    range.setStart(node, newPos);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    // Re-detect trigger
    const t = detectTriggerInNode(node.textContent || "", newPos);
    setTrigger(t);
    setSelectedIdx(0);
  };

  // ── Selection handlers ──

  const selectCategory = (key: string) => replaceTextWithPrefix(key);

  const selectItem = (item: AutoItem) => {
    if (!trigger || trigger.phase !== "items") return;
    replaceTextAndInsertMention(trigger.type, item.id, item.label);
  };

  // ── Input handling ──

  const handleInput = () => {
    refreshTrigger();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const plain = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, plain);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Autocomplete navigation
    if (trigger && totalItems > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, totalItems - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (trigger.phase === "category") selectCategory(filteredCategories[selectedIdx].key);
        else selectItem(items[selectedIdx]);
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setTrigger(null); return; }
    }
    // Submit
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(); return; }
    // Prevent Enter from creating divs — insert <br> instead
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
  };

  // ── Submit ──

  const handleSubmit = async () => {
    if (!editorRef.current || stage !== "idle") return;
    const { text } = extractContent(editorRef.current);
    if (!text.trim()) return;
    if (!settings.openRouterApiKey) { setError("No API key. Go to Settings."); return; }

    setRawText(text);
    setStage("submitting");
    setError("");

    try {
      const result = await parseSessionLog(text, students, subjects, settings.openRouterApiKey, settings.aiModel);
      if (result.students.length === 0) {
        if (studentId) {
          addNote(studentId, text.trim());
          saveSessionLog({ id: crypto.randomUUID(), rawText: text, parsedData: null, createdAt: new Date().toISOString() });
          clearEditor();
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
    saveSessionLog({ id: crypto.randomUUID(), rawText: rawText, parsedData: parsed, createdAt: new Date().toISOString() });
    clearEditor();
    setParsed(null);
    setStage("idle");
    onLogSubmitted?.();
  };

  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    setRawText("");
  };

  // ── Dropdown position: check if there's room above, else go below ──

  const [dropdownAbove, setDropdownAbove] = useState(true);
  useEffect(() => {
    if (!trigger || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownAbove(rect.top > 220);
  }, [trigger]);

  const showDropdown = trigger && totalItems > 0 && stage === "idle";

  return (
    <div ref={containerRef} className="rounded-lg border border-border/50 relative">
      {/* Dropdown */}
      {showDropdown && (
        <div
          className={`absolute left-0 right-0 z-50 ${dropdownAbove ? "bottom-full mb-1" : "top-full mt-1"}`}
          style={{ maxHeight: 200 }}
        >
          <div className="mx-2 rounded-lg border border-border bg-popover shadow-lg overflow-auto" style={{ maxHeight: 200 }}>
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
                  <span className="text-[10px] text-muted-foreground/40 ml-auto font-mono">@{c.key}()</span>
                </button>
              ))
            ) : (
              items.map((item, i) => (
                <button
                  key={item.id}
                  onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors ${
                    i === selectedIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  }`}
                >
                  <span className={`size-1.5 rounded-full shrink-0 ${trigger.type === "student" ? "bg-[var(--mention-student)]" : "bg-[var(--mention-topic)]"}`} />
                  <span className="truncate">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">{item.sublabel}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={stage === "idle"}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onClick={refreshTrigger}
        data-placeholder={studentId
          ? "Log a session... type @ to mention topics. Ctrl+Enter to submit."
          : "Log a session... type @ to mention students or topics."
        }
        className="session-editor w-full px-4 py-3 text-sm bg-card outline-none min-h-[72px] max-h-[200px] overflow-auto rounded-t-lg"
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/5 border-t border-destructive/10">{error}</div>
      )}

      {/* Review */}
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
          <Button variant="outline" size="xs" onClick={handleSubmit}>
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
