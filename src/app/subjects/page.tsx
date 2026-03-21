"use client";

import { useState, useCallback, useRef } from "react";
import { useSubjects, type Subject, type Topic } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// ── Types ──

type ParsedSubject = {
  name: string;
  examBoard: string;
  level: "A-Level" | "GCSE" | "Other";
  specCode: string;
  units: ParsedUnit[];
};

type ParsedTopic = {
  code: string;
  title: string;
  content: string[];
  subtopics?: ParsedTopic[];
};

type ParsedUnit = {
  code: string;
  title: string;
  topics: ParsedTopic[];
};

type FlowStage = "list" | "processing" | "review";

const ACCEPTED_TYPES = ".pdf,.json,.md,.txt";
const ACCEPTED_MIME = ["application/pdf", "application/json", "text/markdown", "text/plain", "text/x-markdown"];

// ── Drop Zone ──

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full border-2 border-dashed rounded-lg flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border/30 hover:border-border/50 hover:bg-accent/5"
      }`}
    >
      <UploadSimple size={18} weight="light" className="text-muted-foreground/40 shrink-0" />
      <span className="text-sm text-muted-foreground/50">Drop a specification file to add a subject</span>
      <span className="text-[10px] text-muted-foreground/30 ml-auto shrink-0">PDF, JSON, MD, TXT</span>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ── Processing skeleton (tree-shaped) ──

function ProcessingView({ fileName }: { fileName: string }) {
  return (
    <div className="max-w-xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/30">
        <CheckCircle size={20} weight="fill" className="text-success shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">Uploaded — parsing with AI</p>
        </div>
      </div>

      {/* Labeled field skeletons */}
      <div className="grid grid-cols-3 gap-3">
        {["Subject", "Board", "Level"].map((l) => (
          <div key={l} className="space-y-1">
            <div className="h-3 w-10 rounded bg-muted/50" />
            <div className="h-8 rounded-md bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Tree-shaped skeleton */}
      <div className="space-y-1.5 pt-2">
        {[
          { w: "60%", indent: 0, bold: true },
          { w: "45%", indent: 1, bold: false },
          { w: "55%", indent: 1, bold: false },
          { w: "40%", indent: 1, bold: false },
          { w: "65%", indent: 0, bold: true },
          { w: "50%", indent: 1, bold: false },
          { w: "35%", indent: 1, bold: false },
          { w: "70%", indent: 0, bold: true },
          { w: "42%", indent: 1, bold: false },
          { w: "58%", indent: 1, bold: false },
          { w: "38%", indent: 1, bold: false },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${row.indent * 20}px` }}>
            <div className="w-8 h-3 rounded bg-muted animate-pulse shrink-0" />
            <div className={`h-3.5 rounded animate-pulse ${row.bold ? "bg-muted" : "bg-muted/60"}`}
              style={{ width: row.w, animationDelay: `${i * 80}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editable inline field ──

function EditableField({ value, onChange, className, mono }: { value: string; onChange: (v: string) => void; className?: string; mono?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input value={draft} onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        className={`bg-transparent border-b border-primary/50 outline-none ${mono ? "font-mono" : ""} ${className ?? ""}`}
        autoFocus />
    );
  }

  return (
    <span onClick={() => { setEditing(true); setDraft(value); }}
      className={`cursor-text hover:bg-accent/30 rounded px-1 -mx-1 transition-colors ${mono ? "font-mono" : ""} ${className ?? ""}`}>
      {value || <span className="text-muted-foreground/40 italic">empty</span>}
    </span>
  );
}

// ── Topic row ──

function TopicRow({ topic, onDelete, depth }: {
  topic: ParsedTopic; onDelete: () => void; depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = topic.subtopics && topic.subtopics.length > 0;
  const hasContent = topic.content && topic.content.length > 0;

  return (
    <div>
      <div className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-accent/20 transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        {(hasChildren || hasContent) ? (
          <button onClick={() => setExpanded(!expanded)} className="w-4 shrink-0 text-muted-foreground/40">
            {expanded ? <CaretDown size={11} /> : <CaretRight size={11} />}
          </button>
        ) : <span className="w-4 shrink-0" />}
        <span className="text-[11px] font-mono text-muted-foreground/50 shrink-0">{topic.code}</span>
        <span className="text-sm flex-1 truncate">{topic.title}</span>
        {hasContent && (
          <span className="text-[10px] text-muted-foreground/40 shrink-0">{topic.content.length} pts</span>
        )}
        <button onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all shrink-0">
          <Trash size={12} />
        </button>
      </div>

      {expanded && hasContent && (
        <div className="space-y-0.5 py-1" style={{ paddingLeft: `${depth * 20 + 36}px` }}>
          {topic.content.map((c, i) => (
            <p key={i} className="text-xs text-muted-foreground/70 leading-relaxed">
              <span className="text-muted-foreground/30 mr-1.5">·</span>{c}
            </p>
          ))}
        </div>
      )}

      {expanded && hasChildren && topic.subtopics!.map((sub, si) => (
        <TopicRow key={si} topic={sub} onDelete={() => {}} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Unit block ──

function countAllTopics(topics: ParsedTopic[]): number {
  let count = 0;
  for (const t of topics) {
    count++;
    if (t.subtopics) count += countAllTopics(t.subtopics);
  }
  return count;
}

function UnitBlock({ unit, onDeleteUnit }: {
  unit: ParsedUnit;
  onDeleteUnit: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const totalTopics = countAllTopics(unit.topics);

  return (
    <div className="border border-border/20 rounded-lg overflow-hidden">
      <div className="group flex items-center gap-2 px-3 py-2.5 bg-muted/30">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground/50 shrink-0">
          {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        <span className="text-xs font-mono text-muted-foreground/50 shrink-0">{unit.code}</span>
        <span className="text-sm font-medium flex-1 truncate">{unit.title}</span>
        <span className="text-[10px] text-muted-foreground/40 mr-1">{totalTopics} topics</span>
        <button onClick={onDeleteUnit}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all">
          <Trash size={13} />
        </button>
      </div>
      {expanded && (
        <div className="px-2 py-1">
          {unit.topics.map((topic, ti) => (
            <TopicRow key={ti} topic={topic} onDelete={() => {}} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Review view ──

function ReviewView({ parsed, onParsedChange, onSave, onReparse }: {
  parsed: ParsedSubject; onParsedChange: (p: ParsedSubject) => void; onSave: () => void; onReparse: () => void;
}) {
  const updateField = <K extends keyof ParsedSubject>(key: K, value: ParsedSubject[K]) => {
    onParsedChange({ ...parsed, [key]: value });
  };

  const deleteUnit = (ui: number) => {
    updateField("units", parsed.units.filter((_, i) => i !== ui));
  };

  const totalTopics = parsed.units.reduce((sum, u) => countAllTopics(u.topics), 0);

  return (
    <div className="max-w-xl mx-auto space-y-5 py-4">
      {/* Labeled metadata fields */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Subject</Label>
          <Input value={parsed.name} onChange={(e) => updateField("name", e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Exam Board</Label>
          <Input value={parsed.examBoard} onChange={(e) => updateField("examBoard", e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Level</Label>
          <div className="flex gap-0.5 h-8 items-center">
            {(["A-Level", "GCSE", "Other"] as const).map((l) => (
              <button key={l} onClick={() => updateField("level", l)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  parsed.level === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {parsed.units.length} units, {totalTopics} topics extracted
      </p>

      {/* Units */}
      <div className="space-y-2">
        {parsed.units.map((unit, ui) => (
          <UnitBlock key={ui} unit={unit} onDeleteUnit={() => deleteUnit(ui)} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/20">
        <button onClick={onReparse}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          Re-parse from file
        </button>
        <Button onClick={onSave} size="sm">Save Subject</Button>
      </div>
    </div>
  );
}

// ── Stored topic tree viewer ──

function StoredTopicTree({ topics }: { topics: Topic[] }) {
  const roots = topics.filter((t) => !t.parentCode)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return (
    <div className="space-y-0.5">
      {roots.map((root) => (
        <StoredTopicNode key={root.id} topic={root} allTopics={topics} depth={0} />
      ))}
    </div>
  );
}

function StoredTopicNode({ topic, allTopics, depth }: { topic: Topic; allTopics: Topic[]; depth: number }) {
  const children = allTopics.filter((t) => t.parentCode === topic.code)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = children.length > 0;
  const hasContent = topic.content && topic.content.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 px-1 rounded hover:bg-accent/20 transition-colors"
        style={{ paddingLeft: `${depth * 18}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="w-4 shrink-0 text-muted-foreground/40">
            {expanded ? <CaretDown size={11} /> : <CaretRight size={11} />}
          </button>
        ) : <span className="w-4 shrink-0" />}
        <span className="text-[10px] font-mono text-muted-foreground/40 w-10 shrink-0">{topic.code}</span>
        <span className="text-xs text-muted-foreground truncate">{topic.title}</span>
        {hasContent && !hasChildren && (
          <button onClick={() => setExpanded(!expanded)} className="text-[9px] text-muted-foreground/30 shrink-0">
            {topic.content.length} pts
          </button>
        )}
      </div>
      {expanded && hasContent && !hasChildren && (
        <div className="space-y-0.5 py-0.5" style={{ paddingLeft: `${depth * 18 + 32}px` }}>
          {topic.content.map((c, i) => (
            <p key={i} className="text-[11px] text-muted-foreground/50 leading-relaxed">
              <span className="text-muted-foreground/20 mr-1">·</span>{c}
            </p>
          ))}
        </div>
      )}
      {expanded && hasChildren && children.map((child) => (
        <StoredTopicNode key={child.id} topic={child} allTopics={allTopics} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Subject row ──

function SubjectRow({ subject }: { subject: Subject }) {
  const { deleteSubject } = useSubjects();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-lg bg-card border border-border/20 hover:border-border/40 transition-colors overflow-hidden">
      <div className="group flex items-center gap-4 px-4 py-3.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <button className="text-muted-foreground/40 shrink-0">
          {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-sm font-medium truncate">{subject.name}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
            {subject.examBoard}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
            {subject.level}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60 shrink-0">
          {subject.topics.length} topics
        </span>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => deleteSubject(subject.id)}
              className="text-[11px] font-medium text-destructive hover:underline">Delete</button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-[11px] text-muted-foreground hover:underline">Cancel</button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/30 hover:text-destructive transition-all shrink-0"
          >
            <Trash size={14} />
          </button>
        )}
      </div>
      {expanded && subject.topics.length > 0 && (
        <div className="border-t border-border/10 px-4 py-2">
          <StoredTopicTree topics={subject.topics} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PHASE 1: Schema Detection
// Identify which known format the JSON matches.
// ═══════════════════════════════════════════════════════════

type SchemaType = "edexcel" | "aqa" | "ocr" | "our-format" | "unknown";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectSchema(data: any): SchemaType {
  const spec = data?.specification ?? data;

  // Our own internal format (re-import)
  if (spec?.units && Array.isArray(spec.units) && spec.units[0]?.topics) return "our-format";

  // Edexcel: themes[] → sections[] → subsections[] → details[]
  if (spec?.themes && Array.isArray(spec.themes)) {
    const theme = spec.themes[0];
    if (theme?.sections?.[0]?.subsections?.[0]?.details) return "edexcel";
  }

  // AQA: topics{} as object with nested subtopics{}
  if (spec?.topics && typeof spec.topics === "object" && !Array.isArray(spec.topics)) {
    const firstKey = Object.keys(spec.topics)[0];
    if (firstKey && spec.topics[firstKey]?.subtopics) return "aqa";
  }

  // OCR-style or other: sections[] → topics[] with content
  if (spec?.sections && Array.isArray(spec.sections)) {
    if (spec.sections[0]?.topics || spec.sections[0]?.subsections) return "ocr";
  }

  return "unknown";
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: Deterministic Transformers
// Convert known schemas into our ParsedSubject format.
// ═══════════════════════════════════════════════════════════

function extractMeta(text: string): { name: string; board: string; level: "A-Level" | "GCSE" | "Other" } {
  const board = text.match(/Edexcel|AQA|OCR|WJEC|Pearson|Cambridge/i)?.[0] ?? "Unknown";
  const level = text.match(/A-Level|A Level|Advanced GCE|GCE/i) ? "A-Level" as const
    : text.match(/GCSE/i) ? "GCSE" as const : "Other" as const;
  let name = text
    .replace(/^Pearson\s+/i, "")
    .replace(/Edexcel\s+/i, "")
    .replace(/Level\s+\d+\s+(Advanced\s+)?/i, "")
    .replace(/(GCE|GCSE)\s+in\s+/i, "")
    .replace(/AQA\s+(A-Level|GCSE)\s+/i, "")
    .trim();
  if (name.length > 40) name = name.slice(0, 40);
  return { name, board, level };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformEdexcel(data: any): ParsedSubject {
  const spec = data.specification ?? data;
  const meta = extractMeta(spec.title ?? "");
  const units: ParsedUnit[] = [];

  for (const theme of (spec.themes ?? [])) {
    for (const section of (theme.sections ?? [])) {
      const topics: ParsedTopic[] = [];
      for (const sub of (section.subsections ?? [])) {
        const subtopics: ParsedTopic[] = [];
        const plainContent: string[] = [];
        for (const detail of (sub.details ?? [])) {
          if (detail.content?.length > 0) {
            subtopics.push({ code: "", title: detail.topic ?? "", content: detail.content });
          } else {
            plainContent.push(detail.topic ?? "");
          }
        }
        topics.push({
          code: sub.id ?? "",
          title: sub.title ?? "",
          content: subtopics.length === 0 ? plainContent : [],
          subtopics: subtopics.length > 0 ? subtopics : undefined,
        });
      }
      units.push({ code: section.id ?? "", title: section.name ?? "", topics });
    }
  }

  return { name: meta.name, examBoard: meta.board, level: meta.level, specCode: spec.code ?? "", units };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAQA(data: any): ParsedSubject {
  const spec = data.specification ?? data;
  const qual = spec.qualification ?? spec.title ?? "";
  const meta = extractMeta(qual);
  const units: ParsedUnit[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walkSubtopics(obj: Record<string, any>): ParsedTopic[] {
    return Object.entries(obj).map(([code, val]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = val as any;
      return {
        code,
        title: v.title ?? "",
        content: v.content ?? [],
        subtopics: v.subtopics ? walkSubtopics(v.subtopics) : undefined,
      };
    });
  }

  const topicsObj = spec.topics ?? {};
  for (const [unitCode, unitData] of Object.entries(topicsObj)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ud = unitData as any;
    const topics = ud.subtopics ? walkSubtopics(ud.subtopics) : [];
    units.push({ code: unitCode, title: ud.title ?? "", topics });
  }

  return { name: meta.name, examBoard: meta.board, level: meta.level, specCode: spec.code ?? "", units };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformOCR(data: any): ParsedSubject {
  const spec = data.specification ?? data;
  const meta = extractMeta(spec.title ?? "");
  const units: ParsedUnit[] = [];

  for (const section of (spec.sections ?? [])) {
    const topics: ParsedTopic[] = [];
    for (const topic of (section.topics ?? section.subsections ?? [])) {
      topics.push({
        code: topic.id ?? topic.code ?? "",
        title: topic.title ?? topic.name ?? "",
        content: topic.content ?? [],
        subtopics: topic.subtopics?.map((st: { code?: string; id?: string; title?: string; name?: string; content?: string[] }) => ({
          code: st.code ?? st.id ?? "",
          title: st.title ?? st.name ?? "",
          content: st.content ?? [],
        })),
      });
    }
    units.push({ code: section.id ?? section.code ?? "", title: section.name ?? section.title ?? "", topics });
  }

  return { name: meta.name, examBoard: meta.board, level: meta.level, specCode: spec.code ?? "", units };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformOurFormat(data: any): ParsedSubject {
  const spec = data.specification ?? data;
  return {
    name: spec.name ?? "",
    examBoard: spec.examBoard ?? "",
    level: spec.level ?? "Other",
    specCode: spec.specCode ?? "",
    units: spec.units ?? [],
  };
}

// ═══════════════════════════════════════════════════════════
// Pipeline: File → Schema Detect → Transform (or AI fallback)
// ═══════════════════════════════════════════════════════════

function tryParseJSON(raw: string): ParsedSubject | null {
  try {
    const data = JSON.parse(raw);
    const schema = detectSchema(data);
    switch (schema) {
      case "edexcel": return transformEdexcel(data);
      case "aqa": return transformAQA(data);
      case "ocr": return transformOCR(data);
      case "our-format": return transformOurFormat(data);
      case "unknown": return null;
    }
  } catch { /* invalid JSON */ }
  return null;
}

async function callAI(messages: { role: string; content: string }[], apiKey: string, model: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 16000 }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  return (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "";
}

const AI_SYSTEM_PROMPT = `You are a UK exam specification parser. Extract the COMPLETE topic structure. Return ONLY valid JSON (no markdown) matching: {"name":"","examBoard":"","level":"A-Level"|"GCSE"|"Other","specCode":"","units":[{"code":"","title":"","topics":[{"code":"","title":"","content":["spec requirement"],"subtopics":[...]}]}]}. Use EXACT numbering and titles from the spec. Extract EVERY topic to the deepest level with content arrays. Do NOT skip, truncate, or summarise.`;

async function parseWithAI(text: string, apiKey: string, model: string): Promise<ParsedSubject> {
  const content = await callAI([
    { role: "system", content: AI_SYSTEM_PROMPT },
    { role: "user", content: `Extract the complete specification structure:\n\n${text.slice(0, 80000)}` },
  ], apiKey, model);

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON.");
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.units?.length) throw new Error("AI could not extract any units from this file.");
  return parsed;
}

async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".txt")) return await file.text();
  if (name.endsWith(".json")) {
    const text = await file.text();
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch { return text; }
  }
  // PDF — extract printable ASCII
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if ((c >= 32 && c <= 126) || c === 10 || c === 13) text += String.fromCharCode(c);
  }
  return text.replace(/\s+/g, " ").replace(/[^\x20-\x7E\n]/g, "");
}

// ── Page ──

export default function SubjectsPage() {
  const { subjects, addSubject, addTopic } = useSubjects();
  const { settings } = useSettings();
  const [stage, setStage] = useState<FlowStage>("list");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedSubject | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    fileRef.current = file;
    setFileName(file.name);
    setStage("processing");
    setError("");

    try {
      // Phase 1: Try deterministic JSON parsing first
      if (file.name.toLowerCase().endsWith(".json")) {
        const raw = await file.text();
        const directParsed = tryParseJSON(raw);
        if (directParsed) {
          setParsed(directParsed);
          setStage("review");
          return;
        }
      }

      // Phase 2: Extract text and use AI as fallback
      const text = await extractFileText(file);
      if (!settings.openRouterApiKey) {
        throw new Error("No API key set. Go to Settings → General to add your OpenRouter key.");
      }
      if (text.trim().length < 100) {
        throw new Error("Could not extract enough text. Try a .txt or .md version.");
      }
      const result = await parseWithAI(text, settings.openRouterApiKey, settings.aiModel);
      setParsed(result);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse specification");
      setStage("list");
    }
  }, [settings.openRouterApiKey, settings.aiModel]);

  const handleSave = useCallback(() => {
    if (!parsed) return;
    const subject = addSubject({
      name: parsed.name,
      examBoard: parsed.examBoard,
      level: parsed.level,
      gradeBoundaries: [
        { grade: "A*", minPercent: 90 }, { grade: "A", minPercent: 80 },
        { grade: "B", minPercent: 70 }, { grade: "C", minPercent: 60 },
        { grade: "D", minPercent: 50 }, { grade: "E", minPercent: 40 },
        { grade: "U", minPercent: 0 },
      ],
    });

    // Recursively flatten nested topics into flat list with parentCode
    function addTopicsRecursive(topics: ParsedTopic[], parentCode: string | null) {
      for (const t of topics) {
        addTopic(subject.id, {
          code: t.code,
          title: t.title,
          parentCode,
          content: t.content ?? [],
        });
        if (t.subtopics) {
          addTopicsRecursive(t.subtopics, t.code);
        }
      }
    }

    for (const unit of parsed.units) {
      addTopic(subject.id, { code: unit.code, title: unit.title, parentCode: null, content: [] });
      addTopicsRecursive(unit.topics, unit.code);
    }

    setParsed(null);
    setStage("list");
  }, [parsed, addSubject, addTopic]);

  const isAdding = stage === "processing" || stage === "review";

  const handlePageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className="p-8 h-full flex flex-col"
      onDragOver={!isAdding ? (e) => e.preventDefault() : undefined}
      onDrop={!isAdding ? handlePageDrop : undefined}
    >
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define subjects, exam boards, and topic trees.
          </p>
        </div>
        {isAdding && (
          <Button variant="ghost" size="sm" onClick={() => { setStage("list"); setParsed(null); setError(""); }}>
            Cancel
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive shrink-0">
          {error}
        </div>
      )}

      <div className="mt-6 flex-1 min-h-0 overflow-auto">
        <div className="space-y-2">
          {/* Subject rows */}
          {subjects.map((s) => <SubjectRow key={s.id} subject={s} />)}

          {/* Inline processing/review */}
          {stage === "processing" && (
            <div className="border border-border/20 rounded-lg p-4 bg-card">
              <ProcessingView fileName={fileName} />
            </div>
          )}

          {stage === "review" && parsed && (
            <div className="border border-border/20 rounded-lg p-4 bg-card">
              <ReviewView parsed={parsed} onParsedChange={setParsed} onSave={handleSave}
                onReparse={() => { if (fileRef.current) handleFile(fileRef.current); }} />
            </div>
          )}

          {/* Empty drop row — always visible when not processing */}
          {!isAdding && (
            <DropZone onFile={handleFile} />
          )}
        </div>
      </div>
    </div>
  );
}
