"use client";

import { useState, useCallback, useRef } from "react";
import { useSubjects, type Subject, type Topic, type GradeBoundary } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Types for the AI parse flow ──

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

// ── Stage 1: Drop Zone ──

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") onFile(file);
  }, [onFile]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full max-w-md border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-border hover:bg-accent/20"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <UploadSimple size={40} weight="thin" className="mx-auto text-muted-foreground/40 mb-4" />
        <p className="text-sm font-medium">
          Drop your exam specification PDF here
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          The AI will extract subjects, units, and topics automatically
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleSelect}
        />
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        or browse files
      </button>
    </div>
  );
}

// ── Stage 2: Processing ──

function ProcessingView({ fileName }: { fileName: string }) {
  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/30">
        <CheckCircle size={20} weight="fill" className="text-success shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">Uploaded successfully</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 rounded-md bg-muted animate-pulse" style={{ width: `${60 + i * 20}px` }} />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" style={{ width: `${100 + Math.random() * 200}px`, animationDelay: `${i * 100}ms` }} />
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center animate-pulse">
        Extracting specification structure...
      </p>
    </div>
  );
}

// ── Stage 3: Review & Edit ──

function EditableField({ value, onChange, className, mono }: { value: string; onChange: (v: string) => void; className?: string; mono?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(draft); setEditing(false); } if (e.key === "Escape") setEditing(false); }}
        className={`bg-transparent border-b border-primary/50 outline-none ${mono ? "font-mono" : ""} ${className ?? ""}`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => { setEditing(true); setDraft(value); }}
      className={`cursor-text hover:bg-accent/30 rounded px-1 -mx-1 transition-colors ${mono ? "font-mono" : ""} ${className ?? ""}`}
    >
      {value || <span className="text-muted-foreground/40 italic">click to edit</span>}
    </span>
  );
}

function TopicRow({
  topic,
  onUpdate,
  onDelete,
  depth,
}: {
  topic: { code: string; title: string };
  onUpdate: (code: string, title: string) => void;
  onDelete: () => void;
  depth: number;
}) {
  return (
    <div
      className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-accent/20 transition-colors"
      style={{ paddingLeft: `${depth * 24 + 8}px` }}
    >
      <span className="text-[11px] font-mono text-muted-foreground/60 w-12 shrink-0">
        <EditableField value={topic.code} onChange={(v) => onUpdate(v, topic.title)} mono className="text-[11px] w-10" />
      </span>
      <EditableField value={topic.title} onChange={(v) => onUpdate(topic.code, v)} className="text-sm flex-1" />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all"
      >
        <Trash size={13} />
      </button>
    </div>
  );
}

function UnitBlock({
  unit,
  unitIndex,
  onUpdateUnit,
  onUpdateTopic,
  onDeleteTopic,
  onAddTopic,
  onDeleteUnit,
}: {
  unit: ParsedUnit;
  unitIndex: number;
  onUpdateUnit: (code: string, title: string) => void;
  onUpdateTopic: (topicIdx: number, code: string, title: string) => void;
  onDeleteTopic: (topicIdx: number) => void;
  onAddTopic: () => void;
  onDeleteUnit: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border/20 rounded-lg overflow-hidden">
      {/* Unit header */}
      <div className="group flex items-center gap-2 px-3 py-2.5 bg-muted/30">
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground/50 shrink-0">
          {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
        </button>
        <span className="text-xs font-mono text-muted-foreground/60 w-8">
          <EditableField value={unit.code} onChange={(v) => onUpdateUnit(v, unit.title)} mono className="text-xs w-6" />
        </span>
        <EditableField value={unit.title} onChange={(v) => onUpdateUnit(unit.code, v)} className="text-sm font-medium flex-1" />
        <span className="text-[10px] text-muted-foreground/40 mr-1">{unit.topics.length} topics</span>
        <button
          onClick={onDeleteUnit}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/40 hover:text-destructive transition-all"
        >
          <Trash size={13} />
        </button>
      </div>

      {/* Topics */}
      {expanded && (
        <div className="px-2 py-1">
          {unit.topics.map((topic, ti) => (
            <TopicRow
              key={ti}
              topic={topic}
              onUpdate={(code, title) => onUpdateTopic(ti, code, title)}
              onDelete={() => onDeleteTopic(ti)}
              depth={1}
            />
          ))}
          <button
            onClick={onAddTopic}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 px-2 ml-6 transition-colors"
          >
            <Plus size={12} /> Add topic
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewView({
  parsed,
  onParsedChange,
  onSave,
  onReparse,
}: {
  parsed: ParsedSubject;
  onParsedChange: (p: ParsedSubject) => void;
  onSave: () => void;
  onReparse: () => void;
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
    const next = String(Number(lastCode) + 1);
    updateField("units", [...parsed.units, { code: next, title: "", topics: [] }]);
  };

  const totalTopics = parsed.units.reduce((sum, u) => sum + u.topics.length, 0);

  return (
    <div className="space-y-5 py-4">
      {/* Editable metadata */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="px-3 py-1.5 rounded-md bg-card border border-border/30 text-sm">
          <EditableField value={parsed.name} onChange={(v) => updateField("name", v)} className="font-medium" />
        </div>
        <div className="px-3 py-1.5 rounded-md bg-card border border-border/30 text-sm">
          <EditableField value={parsed.examBoard} onChange={(v) => updateField("examBoard", v)} />
        </div>
        <div className="flex gap-1">
          {(["A-Level", "GCSE", "Other"] as const).map((l) => (
            <button key={l} onClick={() => updateField("level", l)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                parsed.level === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              {l}
            </button>
          ))}
        </div>
        {parsed.specCode && (
          <div className="px-2.5 py-1.5 rounded-md bg-card border border-border/30 text-xs font-mono text-muted-foreground">
            <EditableField value={parsed.specCode} onChange={(v) => updateField("specCode", v)} mono className="text-xs" />
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {parsed.units.length} units · {totalTopics} topics — click any text to edit
      </div>

      {/* Units */}
      <div className="space-y-2">
        {parsed.units.map((unit, ui) => (
          <UnitBlock
            key={ui}
            unit={unit}
            unitIndex={ui}
            onUpdateUnit={(code, title) => updateUnit(ui, code, title)}
            onUpdateTopic={(ti, code, title) => updateTopic(ui, ti, code, title)}
            onDeleteTopic={(ti) => deleteTopic(ui, ti)}
            onAddTopic={() => addTopic(ui)}
            onDeleteUnit={() => deleteUnit(ui)}
          />
        ))}
      </div>

      <button
        onClick={addUnit}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus size={13} /> Add unit
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/20">
        <button onClick={onReparse} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowCounterClockwise size={13} /> Re-parse from file
        </button>
        <Button onClick={onSave} size="sm">
          Save Subject
        </Button>
      </div>
    </div>
  );
}

// ── Subject List Card ──

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

// ── AI Parse Logic ──

async function parseSpecWithAI(fileText: string, apiKey: string, model: string): Promise<ParsedSubject> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `You extract exam specification structure from documents. Return ONLY valid JSON with this exact shape:
{
  "name": "Subject Name",
  "examBoard": "Board Name",
  "level": "A-Level" or "GCSE" or "Other",
  "specCode": "spec reference code if found",
  "units": [
    {
      "code": "1",
      "title": "Unit Title",
      "topics": [
        { "code": "1.1", "title": "Topic Title" },
        { "code": "1.2", "title": "Topic Title" }
      ]
    }
  ]
}
Extract ALL units and topics from the specification. Use hierarchical dot-notation codes. No markdown, no explanation, just the JSON.`
        },
        {
          role: "user",
          content: `Extract the specification structure from this document:\n\n${fileText.slice(0, 15000)}`
        }
      ],
      temperature: 0.1,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");
  return JSON.parse(jsonMatch[0]);
}

async function extractTextFromPDF(file: File): Promise<string> {
  // Basic text extraction — reads the file as text
  // In production this would use pdf.js or similar
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let text = "";
  for (let i = 0; i < bytes.length; i++) {
    const char = bytes[i];
    if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
      text += String.fromCharCode(char);
    }
  }
  // Clean up: collapse whitespace, remove binary junk
  return text.replace(/\s+/g, " ").replace(/[^\x20-\x7E\n]/g, "").slice(0, 20000);
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

      const text = await extractTextFromPDF(file);
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
        { grade: "A*", minPercent: 90 },
        { grade: "A", minPercent: 80 },
        { grade: "B", minPercent: 70 },
        { grade: "C", minPercent: 60 },
        { grade: "D", minPercent: 50 },
        { grade: "E", minPercent: 40 },
        { grade: "U", minPercent: 0 },
      ],
    });

    // Add all topics
    for (const unit of parsed.units) {
      addTopic(subject.id, { code: unit.code, title: unit.title, parentCode: null });
      for (const topic of unit.topics) {
        addTopic(subject.id, { code: topic.code, title: topic.title, parentCode: unit.code });
      }
    }

    setParsed(null);
    setStage("list");
  }, [parsed, addSubject, addTopic]);

  const handleReparse = useCallback(() => {
    if (fileRef.current) handleFile(fileRef.current);
  }, [handleFile]);

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stage === "list"
              ? "Define subjects, exam boards, and topic trees."
              : stage === "drop"
              ? "Upload a specification to auto-extract topics."
              : stage === "processing"
              ? "Extracting specification structure..."
              : "Review and edit the extracted structure."}
          </p>
        </div>
        {stage === "list" && (
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setStage("drop")}>
              <UploadSimple size={15} className="mr-1.5" /> Import Spec
            </Button>
          </div>
        )}
        {(stage === "drop" || stage === "review") && (
          <Button variant="ghost" size="sm" onClick={() => { setStage("list"); setParsed(null); setError(""); }}>
            Back to list
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6">
        {stage === "list" && (
          <div className="space-y-2">
            {subjects.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={40} weight="thin" className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No subjects yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Import a spec PDF or create one manually.</p>
                <div className="flex gap-2 justify-center mt-4">
                  <Button size="sm" onClick={() => setStage("drop")}>
                    <UploadSimple size={15} className="mr-1.5" /> Import Spec
                  </Button>
                </div>
              </div>
            ) : (
              subjects.map((s) => <SubjectCard key={s.id} subject={s} />)
            )}
          </div>
        )}

        {stage === "drop" && <DropZone onFile={handleFile} />}
        {stage === "processing" && <ProcessingView fileName={fileName} />}
        {stage === "review" && parsed && (
          <ReviewView
            parsed={parsed}
            onParsedChange={setParsed}
            onSave={handleSave}
            onReparse={handleReparse}
          />
        )}
      </div>
    </div>
  );
}
