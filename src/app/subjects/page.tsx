"use client";

import { useState, useRef } from "react";
import { useSubjects, type Subject, type Topic } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus";
import { UploadSimple } from "@phosphor-icons/react/dist/ssr/UploadSimple";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { DotsThreeVertical } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
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

// ── Types ──

type ParsedSubject = {
  name: string;
  examBoard: string;
  level: "A-Level" | "GCSE" | "Other";
  units: { code: string; title: string; topics: { code: string; title: string }[] }[];
};

type FlowStage = "list" | "processing" | "review";
const ACCEPTED_TYPES = ".pdf,.json,.md,.txt";

// ── Shared helpers ──

function exportSubjectJSON(subject: Subject) {
  const roots = subject.topics.filter(t => !t.parentCode)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const data = {
    name: subject.name, examBoard: subject.examBoard, level: subject.level,
    units: roots.map(root => ({
      code: root.code, title: root.title,
      topics: subject.topics.filter(t => t.parentCode === root.code)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
        .map(t => ({ code: t.code, title: t.title })),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${subject.name.toLowerCase().replace(/\s+/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function SubjectActions({ subject, onDelete, side = "bottom" }: {
  subject: Subject;
  onDelete: () => void;
  side?: "top" | "bottom";
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/50 transition-all outline-none">
          <DotsThreeVertical size={16} weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side={side}>
          <DropdownMenuItem onClick={() => exportSubjectJSON(subject)}>
            <DownloadSimple size={14} /> Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash size={14} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-foreground font-medium">{subject.name}</span> and
              all {subject.topics.length} topics will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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

// ═══════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════

function SubjectRow({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const { deleteSubject } = useSubjects();

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/80 border border-border hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <span className="text-sm font-medium truncate">{subject.name}</span>
      <span className="text-xs text-muted-foreground/40 ml-auto shrink-0">{subject.topics.length} topics</span>
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <SubjectActions subject={subject} onDelete={() => deleteSubject(subject.id)} />
      </div>
    </div>
  );
}

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
        dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
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

function ProcessingRow({ fileName }: { fileName: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-muted/80 border border-border">
      <CircleNotch size={16} className="text-primary animate-spin shrink-0" />
      <span className="text-sm text-muted-foreground truncate">{fileName}</span>
      <span className="text-xs text-muted-foreground/40 ml-auto animate-pulse">Parsing...</span>
    </div>
  );
}

function ReviewRow({ parsed, onSave, onCancel }: {
  parsed: ParsedSubject; onSave: (p: ParsedSubject) => void; onCancel: () => void;
}) {
  const [data, setData] = useState(parsed);
  const [expanded, setExpanded] = useState(true);
  const totalTopics = data.units.reduce((sum, u) => sum + u.topics.length, 0);

  return (
    <div className="rounded-lg bg-muted/80 border border-primary/30 overflow-hidden">
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
                  data.level === l ? "bg-primary text-primary-foreground" : "text-muted-foreground/50 hover:bg-accent"
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
      {expanded && (
        <div className="border-t border-border/20 px-4 py-2">
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

// ═══════════════════════════════════════════════════════════
// DETAIL VIEW
// ═══════════════════════════════════════════════════════════

function SubjectDetail({ subject, onBack }: { subject: Subject; onBack: () => void }) {
  const { deleteSubject, updateSubject } = useSubjects();

  // Editable title
  const [editTitle, setEditTitle] = useState(subject.name);

  // Topic search + expand control
  const [topicSearch, setTopicSearch] = useState("");
  const [expandKey, setExpandKey] = useState(0);
  const [defaultExpanded, setDefaultExpanded] = useState(true);

  const roots = subject.topics
    .filter(t => !t.parentCode)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const q = topicSearch.toLowerCase();
  const matchesSearch = (t: Topic) =>
    !q || t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);

  const filteredRoots = !q ? roots : roots.filter(root =>
    matchesSearch(root) || subject.topics.some(t => t.parentCode === root.code && matchesSearch(t))
  );

  const saveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== subject.name) {
      updateSubject(subject.id, { name: trimmed });
    } else {
      setEditTitle(subject.name);
    }
  };

  const expandAll = () => { setDefaultExpanded(true); setExpandKey(k => k + 1); };
  const collapseAll = () => { setDefaultExpanded(false); setExpandKey(k => k + 1); };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-auto px-8 pt-8 pb-6">
        {/* Editable title */}
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className="text-2xl font-medium tracking-tight bg-transparent outline-none w-full border-b-2 border-transparent hover:border-border/30 focus:border-primary/40 pb-1 transition-colors placeholder:text-muted-foreground/30"
          placeholder="Subject title"
        />
        <p className="mt-1.5 text-sm text-muted-foreground/50">
          {roots.length} units · {subject.topics.length} topics
        </p>

        {/* Separator */}
        <div className="mt-6 border-t border-border/30" />

        {/* Search + controls */}
        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Search topics..."
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <button onClick={expandAll} className="hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent/50">Expand all</button>
            <span className="text-muted-foreground/20">·</span>
            <button onClick={collapseAll} className="hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent/50">Collapse all</button>
          </div>
        </div>

        {/* Topic tree */}
        <div className="mt-5">
          {filteredRoots.length === 0 ? (
            <p className="text-sm text-muted-foreground/40 py-8 text-center">
              {q ? "No topics match your search." : "No topics defined for this subject."}
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredRoots.map(root => (
                <DetailUnit
                  key={`${root.id}-${expandKey}`}
                  root={root}
                  allTopics={subject.topics}
                  search={q}
                  defaultExpanded={defaultExpanded}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer */}
      <footer className="shrink-0 border-t border-border/30 px-6 py-2 flex items-center justify-between bg-background">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Subjects
        </button>
        <SubjectActions
          subject={subject}
          onDelete={() => { deleteSubject(subject.id); onBack(); }}
          side="top"
        />
      </footer>
    </div>
  );
}

function DetailUnit({ root, allTopics, search, defaultExpanded }: {
  root: Topic; allTopics: Topic[]; search: string; defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isSearching = search.length > 0;

  const children = allTopics
    .filter(t => t.parentCode === root.code)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const filteredChildren = !isSearching ? children : children.filter(t =>
    t.title.toLowerCase().includes(search) || t.code.toLowerCase().includes(search)
  );

  const isExpanded = isSearching ? true : expanded;

  return (
    <div className="rounded-lg bg-muted/50 border border-border/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors"
      >
        <TreeToggle expanded={isExpanded} size={18} />
        <span className="text-xs font-mono text-muted-foreground/50 shrink-0">{root.code}</span>
        <span className="text-[15px] font-medium tracking-tight">{root.title}</span>
        <span className="text-xs text-muted-foreground/40 ml-auto shrink-0">
          {filteredChildren.length}{isSearching && filteredChildren.length !== children.length ? `/${children.length}` : ""} {children.length === 1 ? "topic" : "topics"}
        </span>
      </button>

      {isExpanded && filteredChildren.length > 0 && (
        <div className="border-t border-border/20 px-4 py-1.5">
          {filteredChildren.map(child => (
            <DetailTopic key={child.id} topic={child} allTopics={allTopics} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailTopic({ topic, allTopics, search }: { topic: Topic; allTopics: Topic[]; search: string }) {
  const children = allTopics
    .filter(t => t.parentCode === topic.code)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;
  const isSearching = search.length > 0;

  const filteredChildren = !isSearching ? children : children.filter(t =>
    t.title.toLowerCase().includes(search) || t.code.toLowerCase().includes(search)
  );

  return (
    <div>
      <div
        className={`flex items-center gap-3 py-2 px-2 rounded-md transition-colors ${hasChildren ? "cursor-pointer hover:bg-accent/30" : ""}`}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        {hasChildren ? (
          <TreeToggle expanded={expanded} size={14} />
        ) : (
          <span className="w-3.5 flex items-center justify-center shrink-0">
            <span className="size-1.5 rounded-full bg-muted-foreground/20" />
          </span>
        )}
        <span className="text-xs font-mono text-muted-foreground/40 shrink-0">{topic.code}</span>
        <span className="text-sm text-foreground/80">{topic.title}</span>
        {hasChildren && (
          <span className="text-xs text-muted-foreground/30 ml-auto shrink-0">{filteredChildren.length}</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="ml-[8px] pl-4 border-l border-border/15">
          {filteredChildren.map(child => (
            <DetailTopic key={child.id} topic={child} allTopics={allTopics} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PARSING PIPELINE
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

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function SubjectsPage() {
  const { subjects, addSubject, addTopic } = useSubjects();
  const { settings } = useSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<FlowStage>("list");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedSubject | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<File | null>(null);

  // Detail view
  const selectedSubject = selectedId ? subjects.find(s => s.id === selectedId) : null;
  if (selectedSubject) {
    return <SubjectDetail subject={selectedSubject} onBack={() => setSelectedId(null)} />;
  }

  // List view
  const handleFile = async (file: File) => {
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
  };

  const handleSave = (data: ParsedSubject) => {
    const subject = addSubject({
      name: `${data.examBoard} ${data.name} ${data.level}`, examBoard: data.examBoard, level: data.level,
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
  };

  const isAdding = stage === "processing" || stage === "review";

  const q = search.toLowerCase();
  const filtered = !q ? subjects : subjects.filter(s =>
    s.name.toLowerCase().includes(q) || s.examBoard.toLowerCase().includes(q) || s.level.toLowerCase().includes(q)
  );

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

      {/* Search */}
      {subjects.length > 0 && !isAdding && (
        <div className="relative mt-5 shrink-0">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive shrink-0">{error}</div>
      )}

      <div className="mt-4 flex-1 min-h-0 overflow-auto">
        <div className="space-y-2">
          {filtered.map(s => (
            <SubjectRow key={s.id} subject={s} onClick={() => setSelectedId(s.id)} />
          ))}
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
