"use client";

import { useState, useCallback, useRef } from "react";
import { useSubjects, type Subject } from "@/lib/subjects";
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

type ParsedUnit = {
  code: string;
  title: string;
  topics: { code: string; title: string }[];
};

type FlowStage = "list" | "drop" | "processing" | "review";

const ACCEPTED_TYPES = ".pdf,.json,.md,.txt";
const ACCEPTED_MIME = ["application/pdf", "application/json", "text/markdown", "text/plain", "text/x-markdown"];

// ── Drop Zone ──

function DropZone({ onFile, fullHeight }: { onFile: (file: File) => void; fullHeight?: boolean }) {
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
      className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
        fullHeight ? "min-h-[60vh]" : "py-16"
      } ${dragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-border hover:bg-accent/10"}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <UploadSimple size={28} weight="light" className="text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium">Drop your exam specification here</p>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
        PDF, JSON, Markdown, or text files — AI will extract the topic structure
      </p>
      <button onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        className="mt-3 text-xs text-primary hover:underline">or browse files</button>
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

function TopicRow({ topic, onUpdate, onDelete, depth }: {
  topic: { code: string; title: string }; onUpdate: (code: string, title: string) => void; onDelete: () => void; depth: number;
}) {
  return (
    <div className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-accent/20 transition-colors"
      style={{ paddingLeft: `${depth * 24 + 8}px` }}>
      <span className="text-[11px] font-mono text-muted-foreground/60 w-12 shrink-0">
        <EditableField value={topic.code} onChange={(v) => onUpdate(v, topic.title)} mono className="text-[11px] w-10" />
      </span>
      <EditableField value={topic.title} onChange={(v) => onUpdate(topic.code, v)} className="text-sm flex-1" />
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all">
        <Trash size={13} />
      </button>
    </div>
  );
}

// ── Unit block ──

function UnitBlock({ unit, onUpdateUnit, onUpdateTopic, onDeleteTopic, onAddTopic, onDeleteUnit }: {
  unit: ParsedUnit;
  onUpdateUnit: (code: string, title: string) => void;
  onUpdateTopic: (topicIdx: number, code: string, title: string) => void;
  onDeleteTopic: (topicIdx: number) => void;
  onAddTopic: () => void;
  onDeleteUnit: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border/20 rounded-lg overflow-hidden">
      <div className="group flex items-center gap-2 px-3 py-2.5 bg-muted/30">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground/50 shrink-0">
          {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        <span className="text-xs font-mono text-muted-foreground/60 w-8">
          <EditableField value={unit.code} onChange={(v) => onUpdateUnit(v, unit.title)} mono className="text-xs w-6" />
        </span>
        <EditableField value={unit.title} onChange={(v) => onUpdateUnit(unit.code, v)} className="text-sm font-medium flex-1" />
        <span className="text-[10px] text-muted-foreground/40 mr-1">
          {unit.topics.length} {unit.topics.length === 1 ? "topic" : "topics"}
        </span>
        <button onClick={onDeleteUnit}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all">
          <Trash size={13} />
        </button>
      </div>
      {expanded && (
        <div className="px-2 py-1">
          {unit.topics.map((topic, ti) => (
            <TopicRow key={ti} topic={topic}
              onUpdate={(code, title) => onUpdateTopic(ti, code, title)}
              onDelete={() => onDeleteTopic(ti)} depth={1} />
          ))}
          <button onClick={onAddTopic}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 px-2 ml-6 transition-colors">
            <Plus size={12} /> Add topic
          </button>
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

  const updateUnit = (ui: number, code: string, title: string) => {
    const units = [...parsed.units];
    units[ui] = { ...units[ui], code, title };
    updateField("units", units);
  };

  const updateTopic = (ui: number, ti: number, code: string, title: string) => {
    const units = [...parsed.units];
    const topics = [...units[ui].topics];
    topics[ti] = { code, title };
    units[ui] = { ...units[ui], topics };
    updateField("units", units);
  };

  const deleteTopic = (ui: number, ti: number) => {
    const units = [...parsed.units];
    units[ui] = { ...units[ui], topics: units[ui].topics.filter((_, i) => i !== ti) };
    updateField("units", units);
  };

  const deleteUnit = (ui: number) => {
    updateField("units", parsed.units.filter((_, i) => i !== ui));
  };

  const addTopic = (ui: number) => {
    const units = [...parsed.units];
    const lastCode = units[ui].topics.at(-1)?.code ?? `${units[ui].code}.0`;
    const parts = lastCode.split(".");
    const next = [...parts.slice(0, -1), String(Number(parts.at(-1)) + 1)].join(".");
    units[ui] = { ...units[ui], topics: [...units[ui].topics, { code: next, title: "" }] };
    updateField("units", units);
  };

  const addUnit = () => {
    const lastCode = parsed.units.at(-1)?.code ?? "0";
    updateField("units", [...parsed.units, { code: String(Number(lastCode) + 1), title: "", topics: [] }]);
  };

  const totalTopics = parsed.units.reduce((sum, u) => sum + u.topics.length, 0);

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
          <UnitBlock key={ui} unit={unit}
            onUpdateUnit={(code, title) => updateUnit(ui, code, title)}
            onUpdateTopic={(ti, code, title) => updateTopic(ui, ti, code, title)}
            onDeleteTopic={(ti) => deleteTopic(ui, ti)}
            onAddTopic={() => addTopic(ui)}
            onDeleteUnit={() => deleteUnit(ui)} />
        ))}
      </div>

      <button onClick={addUnit}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={13} /> Add unit
      </button>

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

// ── Subject card ──

function SubjectCard({ subject }: { subject: Subject }) {
  const { deleteSubject } = useSubjects();
  const [expanded, setExpanded] = useState(false);
  const rootTopics = subject.topics.filter((t) => !t.parentCode)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return (
    <div className="border border-border/30 rounded-lg bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground/50 shrink-0">
            {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{subject.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{subject.level}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {subject.examBoard} · {subject.topics.length} topics
            </div>
          </div>
        </div>
        <button onClick={() => deleteSubject(subject.id)}
          className="p-1.5 text-muted-foreground/30 hover:text-destructive transition-colors">
          <Trash size={14} />
        </button>
      </div>
      {expanded && rootTopics.length > 0 && (
        <div className="border-t border-border/20 px-4 py-2 space-y-0.5">
          {rootTopics.map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-1 text-xs">
              <span className="font-mono text-muted-foreground/50 w-8">{t.code}</span>
              <span className="text-muted-foreground">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI Parse ──

const SYSTEM_PROMPT = `You are a UK exam specification parser. You extract the COMPLETE topic structure from exam specification documents.

CRITICAL RULES:
1. Extract EVERY SINGLE topic, sub-topic, and sub-sub-topic. Do NOT skip, truncate, or summarise ANY content. If the spec has 200 topics, you MUST output all 200.
2. Use the EXACT numbering from the specification (e.g. 3.1.2, not renumbered).
3. Use the EXACT titles from the specification, word-for-word, not paraphrased.
4. Include ALL levels of hierarchy: units/themes/sections → topics → sub-topics → sub-sub-topics.
5. If a section uses "Theme", "Unit", "Component", "Paper", "Section" etc., map the top-level groupings to "units".
6. Every unit MUST contain at least one topic.
7. Do NOT stop early. Do NOT write "and so on", "etc", "continued", or similar. Output the COMPLETE structure.
8. Do NOT invent topics that aren't in the document.

Return ONLY valid JSON (no markdown fences, no explanation text before or after) with this structure:
{
  "name": "Subject Name",
  "examBoard": "Board Name (AQA, Edexcel, OCR, WJEC, etc.)",
  "level": "A-Level" or "GCSE" or "Other",
  "specCode": "spec code if found, otherwise empty string",
  "units": [
    {
      "code": "3.1",
      "title": "Unit title exactly from spec",
      "topics": [
        { "code": "3.1.1", "title": "Topic title exactly from spec" },
        { "code": "3.1.1.1", "title": "Sub-topic title exactly from spec" }
      ]
    }
  ]
}`;

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
  const choice = (data as { choices?: { message?: { content?: string }, finish_reason?: string }[] }).choices?.[0];
  return choice?.message?.content ?? "";
}

function parseAIResponse(content: string): ParsedSubject {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON. Try a .txt or .md file instead.");
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.units?.length) throw new Error("AI could not extract any units. The file may not contain a recognisable specification structure.");
  return parsed;
}

async function parseSpecWithAI(text: string, apiKey: string, model: string): Promise<ParsedSubject> {
  const MAX_CHUNK = 80000;

  if (text.length <= MAX_CHUNK) {
    const content = await callAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Parse this exam specification. Extract the COMPLETE topic structure — every single topic and sub-topic, no cutoffs, no summaries:\n\n${text}` },
    ], apiKey, model);
    return parseAIResponse(content);
  }

  // Long specs: parse in two passes with overlap
  const content1 = await callAI([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Parse this exam specification (this is the first part of a long document). Extract ALL topics you find:\n\n${text.slice(0, MAX_CHUNK)}` },
  ], apiKey, model);

  const partial = parseAIResponse(content1);

  const remainingText = text.slice(MAX_CHUNK - 5000);
  const content2 = await callAI([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `This is the continuation of the same specification. Units already extracted: ${partial.units.map(u => `${u.code} "${u.title}"`).join(", ")}.\n\nExtract any ADDITIONAL units and topics from the remaining text that were NOT in the list above. Return the same JSON format with only the new content:\n\n${remainingText}` },
  ], apiKey, model);

  try {
    const additional = parseAIResponse(content2);
    for (const newUnit of additional.units) {
      const existing = partial.units.find(u => u.code === newUnit.code);
      if (existing) {
        for (const t of newUnit.topics) {
          if (!existing.topics.some(et => et.code === t.code)) existing.topics.push(t);
        }
      } else {
        partial.units.push(newUnit);
      }
    }
  } catch { /* second pass failed — return what we have */ }

  return partial;
}

async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".json")) {
    const text = await file.text();
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch { return text; }
  }

  if (name.endsWith(".md") || name.endsWith(".txt")) {
    return await file.text();
  }

  // PDF — extract printable ASCII
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    const char = bytes[i];
    if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
      text += String.fromCharCode(char);
    }
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
      if (!settings.openRouterApiKey) {
        throw new Error("No API key set. Go to Settings → General to add your OpenRouter key.");
      }
      const text = await extractFileText(file);
      if (text.trim().length < 100) {
        throw new Error("Could not extract enough text from this file. Try copying the spec content into a .txt or .md file.");
      }
      const result = await parseSpecWithAI(text, settings.openRouterApiKey, settings.aiModel);
      setParsed(result);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse specification");
      setStage("drop");
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
    for (const unit of parsed.units) {
      addTopic(subject.id, { code: unit.code, title: unit.title, parentCode: null });
      for (const topic of unit.topics) {
        addTopic(subject.id, { code: topic.code, title: topic.title, parentCode: unit.code });
      }
    }
    setParsed(null);
    setStage("list");
  }, [parsed, addSubject, addTopic]);

  const hasSubjects = subjects.length > 0;
  const subtitle = stage === "processing" ? "Extracting specification structure..."
    : stage === "review" ? "Review and edit the extracted structure."
    : "Define subjects, exam boards, and topic trees.";

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {stage === "list" && hasSubjects && (
          <Button size="sm" onClick={() => setStage("drop")}>
            <Plus size={15} className="mr-1.5" /> Add Subject
          </Button>
        )}
        {(stage === "drop" || stage === "review") && (
          <Button variant="ghost" size="sm" onClick={() => { setStage("list"); setParsed(null); setError(""); }}>
            Back to list
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive shrink-0">
          {error}
        </div>
      )}

      <div className="mt-6 flex-1 min-h-0">
        {stage === "list" && !hasSubjects && <DropZone onFile={handleFile} fullHeight />}
        {stage === "list" && hasSubjects && (
          <div className="space-y-2">{subjects.map((s) => <SubjectCard key={s.id} subject={s} />)}</div>
        )}
        {stage === "drop" && <DropZone onFile={handleFile} />}
        {stage === "processing" && <ProcessingView fileName={fileName} />}
        {stage === "review" && parsed && (
          <ReviewView parsed={parsed} onParsedChange={setParsed} onSave={handleSave}
            onReparse={() => { if (fileRef.current) handleFile(fileRef.current); }} />
        )}
      </div>
    </div>
  );
}
