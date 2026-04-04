"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useStudents } from "@/lib/students";
import { useSubjects } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { parseSessionLog, saveSessionLog, resolveSessionSlot, type ParsedSessionData } from "@/lib/session-log";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { PaperPlaneRight } from "@phosphor-icons/react/dist/ssr/PaperPlaneRight";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { Button } from "@/components/ui/button";

type MentionEntry = { type: "student" | "topic"; id: string; label: string };

type TriggerState =
  | { phase: "unified"; query: string; start: number }
  | { phase: "items"; type: "student" | "topic"; query: string; start: number }
  | null;

type AutoItem = { id: string; label: string; sublabel: string; type: "student" | "topic" };

function detectTriggerInNode(text: string, pos: number): TriggerState {
  const before = text.slice(0, pos);
  const sm = before.match(/@student\(([^)@]*)$/);
  if (sm) return { phase: "items", type: "student", query: sm[1], start: pos - sm[0].length };
  const tm = before.match(/@topic\(([^)@]*)$/);
  if (tm) return { phase: "items", type: "topic", query: tm[1], start: pos - tm[0].length };
  const bare = before.match(/@([^@\s(]*)$/);
  if (bare) return { phase: "unified", query: bare[1], start: pos - bare[0].length };
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
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Autocomplete data ──

  const items: AutoItem[] = (() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();

    // Build topic pool (scoped to student's subject if on student page)
    let topicPool = subjects.flatMap(sub => sub.topics.map(t => ({ ...t, subName: sub.name })));
    if (studentId) {
      const st = students.find(s => s.id === studentId);
      if (st?.subjectId) {
        const scoped = subjects.find(s => s.id === st.subjectId);
        if (scoped) topicPool = scoped.topics.map(t => ({ ...t, subName: scoped.name }));
      }
    }

    // Sort topics: leaf topics first (by code number), header topics last
    const sortTopics = (list: typeof topicPool) => [...list].sort((a, b) => {
      const aIsHeader = topicPool.some(t => t.parentCode === a.code);
      const bIsHeader = topicPool.some(t => t.parentCode === b.code);
      if (aIsHeader !== bIsHeader) return aIsHeader ? 1 : -1;
      const aParts = a.code.split(".").map(Number);
      const bParts = b.code.split(".").map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const av = aParts[i] ?? -1, bv = bParts[i] ?? -1;
        if (av !== bv) return av - bv;
      }
      return 0;
    });

    if (trigger.phase === "items" && trigger.type === "student") {
      return students
        .filter(s => s.name.toLowerCase().includes(q) || s.referenceNumber.toLowerCase().includes(q))
        .sort((a, b) => (a.isStarred === b.isStarred ? a.name.localeCompare(b.name) : a.isStarred ? -1 : 1))
        .slice(0, 12)
        .map(s => ({ id: s.id, label: s.name, sublabel: s.referenceNumber, type: "student" as const }));
    }

    if (trigger.phase === "items" && trigger.type === "topic") {
      const filtered = topicPool.filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
      return sortTopics(filtered).slice(0, 12)
        .map(t => ({ id: t.id, label: `${t.code} ${t.title}`, sublabel: t.subName, type: "topic" as const }));
    }

    // Unified: show students + topics together when user just types @
    const studentItems: AutoItem[] = students
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.referenceNumber.toLowerCase().includes(q))
      .sort((a, b) => (a.isStarred === b.isStarred ? a.name.localeCompare(b.name) : a.isStarred ? -1 : 1))
      .slice(0, 6)
      .map(s => ({ id: s.id, label: s.name, sublabel: s.referenceNumber, type: "student" as const }));

    const filteredTopics = topicPool.filter(t => !q || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    const topicItems: AutoItem[] = sortTopics(filteredTopics)
      .slice(0, 8)
      .map(t => ({ id: t.id, label: `${t.code} ${t.title}`, sublabel: t.subName, type: "topic" as const }));

    return [...studentItems, ...topicItems].slice(0, 14);
  })();

  const totalItems = items.length;

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

  // ── Selection handler ──

  const selectItem = (item: AutoItem) => {
    if (!trigger) return;
    replaceTextAndInsertMention(item.type, item.id, item.label);
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
        selectItem(items[selectedIdx]);
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

  // ── Timestamp helper ──

  const makeLogTimestamp = () => {
    const [year, month, day] = logDate.split("-").map(Number);
    const now = new Date();
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
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
          const ts = makeLogTimestamp();
          saveSessionLog({ id: crypto.randomUUID(), rawText: text, parsedData: null, sessionSlot: resolveSessionSlot(ts), createdAt: ts.toISOString() });
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
      updateStudent(sd.studentId, { completedSessions: student.completedSessions + 1 });
    }
    const ts = makeLogTimestamp();
    saveSessionLog({ id: crypto.randomUUID(), rawText: rawText, parsedData: parsed, sessionSlot: resolveSessionSlot(ts), createdAt: ts.toISOString() });
    clearEditor();
    setParsed(null);
    setStage("idle");
    onLogSubmitted?.();
  };

  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    setRawText("");
    setLogDate(new Date().toISOString().slice(0, 10));
  };

  // ── Dropdown position: check if there's room above, else go below ──

  const [dropdownAbove, setDropdownAbove] = useState(true);
  useEffect(() => {
    if (!trigger || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownAbove(rect.top > 380);
  }, [trigger]);

  const showDropdown = trigger && totalItems > 0 && stage === "idle";

  return (
    <div ref={containerRef} className="rounded-lg border border-border/50 relative">
      {/* Dropdown */}
      {showDropdown && (
        <div
          className={`absolute left-0 right-0 z-50 ${dropdownAbove ? "bottom-full mb-1" : "top-full mt-1"}`}
          style={{ maxHeight: 360 }}
        >
          <div className="mx-2 rounded-lg border border-border bg-popover shadow-lg overflow-auto" style={{ maxHeight: 360 }}>
            {items.map((item, i) => (
              <button
                key={`${item.type}-${item.id}`}
                onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors ${
                  i === selectedIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                }`}
              >
                {item.type === "student"
                  ? <Users size={14} className="text-[var(--mention-student)] shrink-0" />
                  : <Books size={14} className="text-[var(--mention-topic)] shrink-0" />
                }
                <span className="truncate">{item.label}</span>
                <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">{item.sublabel}</span>
              </button>
            ))}
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
        <div className="border-t border-border/20 bg-muted/30">
          <div className="px-4 py-2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            Review before saving
          </div>
          <div className="px-4 pb-3 space-y-3">
            {parsed.students.map(sd => (
              <div key={sd.studentId} className="rounded-md border border-border/40 bg-card overflow-hidden">
                {/* Student header */}
                <div className="px-3 py-2 bg-muted/50 flex items-center gap-2 border-b border-border/20">
                  <span className="size-1.5 rounded-full bg-[var(--mention-student)]" />
                  <span className="text-sm font-medium">{sd.studentName}</span>
                </div>
                <div className="px-3 py-2 space-y-2">
                  {/* Notes */}
                  {sd.notes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground/50 mb-1">Notes</p>
                      {sd.notes.map((note, i) => (
                        <p key={i} className="text-xs text-foreground/70 pl-2 border-l-2 border-border/30 mb-1">{note}</p>
                      ))}
                    </div>
                  )}
                  {/* Test results */}
                  {sd.testResults.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground/50 mb-1">Test Results</p>
                      {sd.testResults.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs mb-1">
                          <span className="text-foreground/70">{r.name}</span>
                          <span className="font-medium tabular-nums">{r.scoreGot}/{r.scoreOf}</span>
                          <span className="text-muted-foreground/50">({Math.round((r.scoreGot / r.scoreOf) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Topics */}
                  {sd.topicIds.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground/50 mb-1">Topics Covered</p>
                      <div className="flex flex-wrap gap-1">
                        {sd.topicIds.map(tid => {
                          const topic = subjects.flatMap(s => s.topics).find(t => t.id === tid);
                          return (
                            <span key={tid} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${topic ? "bg-[color-mix(in_srgb,var(--mention-topic)_15%,transparent)] text-[var(--mention-topic)]" : "bg-muted text-muted-foreground/40 line-through"}`}>
                              {topic ? `${topic.code} ${topic.title}` : "[deleted]"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Empty state */}
                  {sd.notes.length === 0 && sd.testResults.length === 0 && sd.topicIds.length === 0 && (
                    <p className="text-xs text-muted-foreground/40">Session logged, no additional details extracted.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center justify-between rounded-b-lg bg-muted/40">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/40">
            Type <kbd className="px-1 py-0.5 rounded border border-border/50 bg-background/80 font-mono text-[9px]">@</kbd> to mention · Ctrl+Enter to submit
          </span>
          {stage === "idle" && (
            <label className="flex items-center gap-1 cursor-pointer">
              <CalendarBlank size={12} className="text-muted-foreground/40" />
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="text-[10px] bg-transparent border-none outline-none text-muted-foreground/60 cursor-pointer w-[90px]"
              />
            </label>
          )}
        </div>
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
