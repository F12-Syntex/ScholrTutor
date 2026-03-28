"use client";

import { useState, useCallback, useRef } from "react";
import { useSubjects, type Subject, type Topic } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Types — simplified: just major.minor ──

type ParsedSubject = {
  name: string;
  examBoard: string;
  level: "A-Level" | "GCSE" | "Other";
  units: { code: string; title: string; topics: { code: string; title: string }[] }[];
};

type FlowStage = "list" | "processing" | "review";
const ACCEPTED_TYPES = ".pdf,.json,.md,.txt";

// ── Tree toggle (+/−) ──

function TreeToggle({ expanded, size = 16 }: { expanded: boolean; size?: number }) {
  const iconSize = Math.round(size * 0.55);
  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px] border border-border/60 text-muted-foreground/50 shrink-0 transition-colors hover:border-border hover:text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {expanded ? <Minus size={iconSize} weight="bold" /> : <Plus size={iconSize} weight="bold" />}
    </span>
  );
}

// ── Drop row (looks like an empty subject row) ──

function DropRow({ onFile }: { onFile: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={`flex items-center gap-3 px-4 py-3.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-border/30 hover:border-border/50"
      }`}
    >
      <UploadSimple size={16} className="text-muted-foreground/40 shrink-0" />
      <span className="text-sm text-muted-foreground/50">Drop a spec file to add a subject</span>
      <span className="text-[10px] text-muted-foreground/30 ml-auto">PDF, JSON, MD, TXT</span>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ── Processing row (inline, same height as a subject row) ──

function ProcessingRow({ fileName }: { fileName: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-card border border-border/20">
      <CircleNotch size={16} className="text-primary animate-spin shrink-0" />
      <span className="text-sm text-muted-foreground truncate">{fileName}</span>
      <span className="text-xs text-muted-foreground/40 ml-auto animate-pulse">Parsing...</span>
    </div>
  );
}

// ── Review row (inline, expands to show parsed result) ──

function ReviewRow({ parsed, onSave, onCancel }: {
  parsed: ParsedSubject; onSave: (p: ParsedSubject) => void; onCancel: () => void;
}) {
  const [data, setData] = useState(parsed);
  const [expanded, setExpanded] = useState(true);
  const totalTopics = data.units.reduce((sum, u) => sum + u.topics.length, 0);

  return (
    <div className="rounded-lg bg-card border border-primary/30 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <TreeToggle expanded={expanded} size={16} />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Input value={data.name} onClick={(e) => e.stopPropagation()}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="h-7 text-sm font-medium w-40" placeholder="Subject name" />
          <Input value={data.examBoard} onClick={(e) => e.stopPropagation()}
            onChange={(e) => setData({ ...data, examBoard: e.target.value })}
            className="h-7 text-xs w-24" placeholder="Board" />
          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            {(["A-Level", "GCSE", "Other"] as const).map((l) => (
              <button key={l} onClick={() => setData({ ...data, level: l })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  data.level === l ? "bg-primary text-primary-foreground" : "text-muted-foreground/50 hover:bg-muted"
                }`}>{l}</button>
            ))}
          </div>
        </div>
        <span className="text-xs text-muted-foreground/50 shrink-0">{data.units.length} units · {totalTopics} topics</span>
        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" className="h-7 text-xs" onClick={() => onSave(data)}>
            <Check size={13} className="mr-1" /> Save
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        </div>
      </div>

      {/* Expanded: topic tree */}
      {expanded && (
        <div className="border-t border-border/10 px-4 py-2">
          {data.units.map((unit, ui) => (
            <UnitPreview key={ui} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}

function UnitPreview({ unit }: { unit: { code: string; title: string; topics: { code: string; title: string }[] } }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-accent/40 cursor-pointer transition-colors" onClick={() => setExpanded(!expanded)}>
        <TreeToggle expanded={expanded} size={14} />
        <span className="text-[11px] font-mono text-muted-foreground/40">{unit.code}</span>
        <span className="text-xs font-medium text-foreground/70">{unit.title}</span>
        <span className="text-[10px] text-muted-foreground/30 ml-auto">{unit.topics.length}</span>
      </div>
      {expanded && (
        <div className="ml-[8px] pl-3 border-l border-border/20">
          {unit.topics.map((t, ti) => (
            <div key={ti} className="flex items-center gap-2 py-0.5 px-1.5">
              <span className="size-1 rounded-full bg-muted-foreground/20 shrink-0" />
              <span className="text-[11px] font-mono text-muted-foreground/30">{t.code}</span>
              <span className="text-xs text-muted-foreground/60">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stored subject row ──

function SubjectRow({ subject }: { subject: Subject }) {
  const { deleteSubject } = useSubjects();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const roots = subject.topics.filter((t) => !t.parentCode)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return (
    <div>
      <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <TreeToggle expanded={expanded} size={18} />
        <span className="text-sm font-medium truncate">{subject.name}</span>
        <span className="text-[11px] text-muted-foreground/50 shrink-0">{subject.examBoard} · {subject.level}</span>
        <span className="text-xs text-muted-foreground/40 ml-auto shrink-0">{subject.topics.length} topics</span>
        {confirmDelete ? (
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => deleteSubject(subject.id)} className="text-[11px] font-medium text-destructive hover:underline">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-muted-foreground hover:underline">Cancel</button>
          </div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/30 hover:text-destructive transition-all shrink-0">
            <Trash size={14} />
          </button>
        )}
      </div>
      {expanded && roots.length > 0 && (
        <div className="ml-[21px] pl-3.5 border-l border-border/25 py-0.5 mb-1">
          {roots.map((root) => (
            <StoredUnit key={root.id} topic={root} allTopics={subject.topics} />
          ))}
        </div>
      )}
    </div>
  );
}

function StoredUnit({ topic, allTopics }: { topic: Topic; allTopics: Topic[] }) {
  const children = allTopics.filter((t) => t.parentCode === topic.code)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1 px-1.5 rounded-md transition-colors ${hasChildren ? "cursor-pointer hover:bg-accent/40" : ""}`}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        {hasChildren ? (
          <TreeToggle expanded={expanded} size={14} />
        ) : (
          <span className="w-3.5 flex items-center justify-center shrink-0">
            <span className="size-1 rounded-full bg-muted-foreground/25" />
          </span>
        )}
        <span className="text-[11px] font-mono text-muted-foreground/40 shrink-0">{topic.code}</span>
        <span className={`text-xs ${hasChildren ? "font-medium text-foreground/70" : "text-muted-foreground/60"}`}>{topic.title}</span>
        {hasChildren && <span className="text-[10px] text-muted-foreground/30 ml-auto">{children.length}</span>}
      </div>
      {expanded && children.length > 0 && (
        <div className="ml-[8px] pl-3 border-l border-border/20">
          {children.map((child) => (
            <StoredUnit key={child.id} topic={child} allTopics={allTopics} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PARSING PIPELINE
// Phase 1: Schema detect → Phase 2: Transform (or AI fallback)
// Simplified: just major.minor — code + title only
// ═══════════════════════════════════════════════════════════

function extractMeta(text: string): { name: string; board: string; level: "A-Level" | "GCSE" | "Other" } {
  const board = text.match(/Edexcel|AQA|OCR|WJEC|Pearson|Cambridge/i)?.[0] ?? "Unknown";
  const level = text.match(/A-Level|A Level|Advanced GCE|GCE/i) ? "A-Level" as const
    : text.match(/GCSE/i) ? "GCSE" as const : "Other" as const;
  let name = text.replace(/^Pearson\s+/i, "").replace(/Edexcel\s+/i, "")
    .replace(/Level\s+\d+\s+(Advanced\s+)?/i, "").replace(/(GCE|GCSE)\s+in\s+/i, "")
    .replace(/AQA\s+(A-Level|GCSE)\s+/i, "").trim();
  if (name.length > 40) name = name.slice(0, 40);
  return { name, board, level };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryParseJSON(raw: string): ParsedSubject | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(raw) as any;
    const spec = data.specification ?? data;

    // Edexcel: themes[] → sections[] → subsections[]
    if (spec.themes && Array.isArray(spec.themes)) {
      const meta = extractMeta(spec.title ?? "");
      const units: ParsedSubject["units"] = [];
      for (const theme of spec.themes) {
        for (const section of (theme.sections ?? [])) {
          const topics: { code: string; title: string }[] = [];
          for (const sub of (section.subsections ?? [])) {
            topics.push({ code: sub.id ?? "", title: sub.title ?? "" });
          }
          units.push({ code: section.id ?? "", title: section.name ?? "", topics });
        }
      }
      return { name: meta.name, examBoard: meta.board, level: meta.level, units };
    }

    // AQA: topics{} with nested subtopics{}
    if (spec.topics && typeof spec.topics === "object" && !Array.isArray(spec.topics)) {
      const qual = spec.qualification ?? spec.title ?? "";
      const meta = extractMeta(qual);
      const units: ParsedSubject["units"] = [];
      for (const [unitCode, unitData] of Object.entries(spec.topics)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ud = unitData as any;
        const topics: { code: string; title: string }[] = [];
        if (ud.subtopics) {
          for (const [code, td] of Object.entries(ud.subtopics)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            topics.push({ code, title: (td as any).title ?? "" });
          }
        }
        units.push({ code: unitCode, title: ud.title ?? "", topics });
      }
      return { name: meta.name, examBoard: meta.board, level: meta.level, units };
    }

    // Our format: units[] with topics[]
    if (spec.units && Array.isArray(spec.units)) {
      return { name: spec.name ?? "", examBoard: spec.examBoard ?? "", level: spec.level ?? "Other", units: spec.units };
    }
  } catch { /* invalid JSON */ }
  return null;
}

async function parseWithAI(text: string, apiKey: string, model: string): Promise<ParsedSubject> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: `Extract exam specification structure. Return ONLY valid JSON: {"name":"","examBoard":"","level":"A-Level"|"GCSE"|"Other","units":[{"code":"1.1","title":"Major Topic","topics":[{"code":"1.1.1","title":"Minor Topic"}]}]}. Use EXACT codes and titles from the spec. Two levels only: major topics (units) and minor topics. No descriptions, no content arrays, just code+title.` },
        { role: "user", content: `Extract the topic structure:\n\n${text.slice(0, 80000)}` },
      ],
      temperature: 0,
      max_tokens: 16000,
    }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return valid JSON.");
  const parsed = JSON.parse(match[0]);
  if (!parsed.units?.length) throw new Error("No units extracted.");
  return parsed;
}

async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".txt")) return await file.text();
  if (name.endsWith(".json")) {
    const t = await file.text();
    try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return t; }
  }
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
      if (file.name.toLowerCase().endsWith(".json")) {
        const raw = await file.text();
        const direct = tryParseJSON(raw);
        if (direct) { setParsed(direct); setStage("review"); return; }
      }

      const text = await extractFileText(file);
      if (!settings.openRouterApiKey) throw new Error("No API key. Go to Settings → General.");
      if (text.trim().length < 100) throw new Error("Not enough text. Try a .txt or .md file.");
      const result = await parseWithAI(text, settings.openRouterApiKey, settings.aiModel);
      setParsed(result);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse.");
      setStage("list");
    }
  }, [settings.openRouterApiKey, settings.aiModel]);

  const handleSave = useCallback((data: ParsedSubject) => {
    const subject = addSubject({
      name: data.name, examBoard: data.examBoard, level: data.level,
      gradeBoundaries: [
        { grade: "A*", minPercent: 90 }, { grade: "A", minPercent: 80 },
        { grade: "B", minPercent: 70 }, { grade: "C", minPercent: 60 },
        { grade: "D", minPercent: 50 }, { grade: "E", minPercent: 40 },
        { grade: "U", minPercent: 0 },
      ],
    });
    for (const unit of data.units) {
      addTopic(subject.id, { code: unit.code, title: unit.title, parentCode: null, content: [] });
      for (const topic of unit.topics) {
        addTopic(subject.id, { code: topic.code, title: topic.title, parentCode: unit.code, content: [] });
      }
    }
    setParsed(null);
    setStage("list");
  }, [addSubject, addTopic]);

  const isAdding = stage === "processing" || stage === "review";

  return (
    <div className="p-8 h-full flex flex-col"
      onDragOver={!isAdding ? (e) => e.preventDefault() : undefined}
      onDrop={!isAdding ? (e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); } : undefined}>
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define subjects, exam boards, and topic trees.</p>
        </div>
        {isAdding && (
          <Button variant="ghost" size="sm" onClick={() => { setStage("list"); setParsed(null); setError(""); }}>Cancel</Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive shrink-0">{error}</div>
      )}

      <div className="mt-6 flex-1 min-h-0 overflow-auto">
        <div className="space-y-0.5">
          {subjects.map((s) => <SubjectRow key={s.id} subject={s} />)}
          {stage === "processing" && <ProcessingRow fileName={fileName} />}
          {stage === "review" && parsed && (
            <ReviewRow parsed={parsed} onSave={handleSave} onCancel={() => { setStage("list"); setParsed(null); }} />
          )}
          {!isAdding && <DropRow onFile={handleFile} />}
        </div>
      </div>
    </div>
  );
}
