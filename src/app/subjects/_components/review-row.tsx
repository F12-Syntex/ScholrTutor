"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TreeToggle } from "./tree-toggle";
import type { ParsedSubject } from "./parse";

export function ProcessingRow({ fileName }: { fileName: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg border border-border bg-muted/60 px-4 py-3"
    >
      <CircleNotch
        size={16}
        className="shrink-0 animate-spin text-primary"
      />
      <span className="truncate text-sm text-muted-foreground">{fileName}</span>
      <span className="ml-auto text-xs text-muted-foreground">Parsing…</span>
    </div>
  );
}

export function ReviewRow({
  parsed,
  onSave,
  onCancel,
}: {
  parsed: ParsedSubject;
  onSave: (p: ParsedSubject) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState(parsed);
  const [expanded, setExpanded] = useState(true);
  const totalTopics = data.units.reduce((sum, u) => sum + u.topics.length, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-primary/40 bg-muted/60">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse" : "Expand"}
          aria-expanded={expanded}
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
        >
          <TreeToggle expanded={expanded} size={18} />
        </button>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="h-8 w-44 text-sm font-medium"
            placeholder="Subject name"
            aria-label="Subject name"
          />
          <Input
            value={data.examBoard}
            onChange={(e) => setData({ ...data, examBoard: e.target.value })}
            className="h-8 w-28 text-xs"
            placeholder="Board"
            aria-label="Exam board"
          />
          <div
            role="radiogroup"
            aria-label="Level"
            className="flex rounded-md bg-background p-0.5"
          >
            {(["A-Level", "GCSE", "Other"] as const).map((l) => {
              const active = data.level === l;
              return (
                <button
                  key={l}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setData({ ...data, level: l })}
                  className={`h-6 rounded px-2 text-[11px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {data.units.length} units · {totalTopics} topics
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => onSave(data)}>
            <Check size={13} className="mr-1" /> Save
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border bg-card/50 px-4 py-2">
          {data.units.map((unit, ui) => (
            <UnitPreview key={ui} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}

function UnitPreview({
  unit,
}: {
  unit: { code: string; title: string; topics: { code: string; title: string }[] };
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <TreeToggle expanded={expanded} size={14} />
        <span className="font-mono text-xs text-muted-foreground">{unit.code}</span>
        <span className="text-sm font-medium text-foreground">{unit.title}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {unit.topics.length}
        </span>
      </button>
      {expanded && (
        <ul className="ml-2 border-l border-border pl-3">
          {unit.topics.map((t, ti) => (
            <li
              key={ti}
              className="flex items-center gap-2 px-1.5 py-0.5"
            >
              <span
                aria-hidden
                className="size-1 rounded-full bg-muted-foreground/40"
              />
              <span className="font-mono text-xs text-muted-foreground">
                {t.code}
              </span>
              <span className="text-sm text-foreground/80">{t.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
