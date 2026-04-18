"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { useSubjects } from "@/lib/subjects";
import { useSettings } from "@/lib/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubjectRow } from "./_components/subject-row";
import { DropRow } from "./_components/drop-row";
import { ReviewRow, ProcessingRow } from "./_components/review-row";
import { SubjectDetail } from "./_components/subject-detail";
import {
  tryParseJson,
  parseWithAi,
  extractFileText,
  type ParsedSubject,
} from "./_components/parse";

type Stage = "list" | "processing" | "review";

export default function SubjectsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { subjects, addSubject, addTopic } = useSubjects();
  const { settings } = useSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<Stage>("list");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedSubject | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<File | null>(null);

  useEffect(() => {
    const id = params.get("id");
    if (id) setSelectedId(id);
  }, [params]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.examBoard.toLowerCase().includes(q) ||
        s.level.toLowerCase().includes(q),
    );
  }, [subjects, search]);

  const selected = selectedId ? subjects.find((s) => s.id === selectedId) : null;
  if (selected) {
    return (
      <SubjectDetail
        subject={selected}
        onBack={() => {
          setSelectedId(null);
          if (params.get("id")) router.replace("/subjects");
        }}
      />
    );
  }

  const handleFile = async (file: File) => {
    fileRef.current = file;
    setFileName(file.name);
    setStage("processing");
    setError("");
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const raw = await file.text();
        const direct = tryParseJson(raw);
        if (direct) {
          setParsed(direct);
          setStage("review");
          return;
        }
      }
      const text = await extractFileText(file);
      if (!settings.openRouterApiKey) {
        throw new Error("No API key. Go to Settings → General.");
      }
      if (text.trim().length < 100) {
        throw new Error("Not enough text. Try a .txt or .md file.");
      }
      const result = await parseWithAi(
        text,
        settings.openRouterApiKey,
        settings.aiModel,
      );
      setParsed(result);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse.");
      setStage("list");
    }
  };

  const handleSave = (data: ParsedSubject) => {
    const subject = addSubject({
      name: `${data.examBoard} ${data.name} ${data.level}`.trim(),
      examBoard: data.examBoard,
      level: data.level,
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
    for (const unit of data.units) {
      addTopic(subject.id, {
        code: unit.code,
        title: unit.title,
        parentCode: null,
        content: [],
      });
      for (const topic of unit.topics) {
        addTopic(subject.id, {
          code: topic.code,
          title: topic.title,
          parentCode: unit.code,
          content: [],
        });
      }
    }
    setParsed(null);
    setStage("list");
  };

  const isBusy = stage === "processing" || stage === "review";

  return (
    <div
      className="flex h-full flex-col p-4 sm:p-8"
      onDragOver={!isBusy ? (e) => e.preventDefault() : undefined}
      onDrop={
        !isBusy
          ? (e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }
          : undefined
      }
    >
      <header className="flex flex-col gap-4 shrink-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define subjects, exam boards, and topic trees.
          </p>
        </div>
        {isBusy && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStage("list");
              setParsed(null);
              setError("");
            }}
          >
            Cancel
          </Button>
        )}
      </header>

      {subjects.length > 0 && !isBusy && (
        <div className="relative mt-5 shrink-0">
          <MagnifyingGlass
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects…"
            aria-label="Search subjects"
            className="h-9 pl-8"
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive shrink-0"
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex-1 min-h-0 overflow-auto">
        <div className="space-y-2">
          {filtered.map((s) => (
            <SubjectRow key={s.id} subject={s} onClick={() => setSelectedId(s.id)} />
          ))}
          {stage === "processing" && <ProcessingRow fileName={fileName} />}
          {stage === "review" && parsed && (
            <ReviewRow
              parsed={parsed}
              onSave={handleSave}
              onCancel={() => {
                setStage("list");
                setParsed(null);
              }}
            />
          )}
          {!isBusy && <DropRow onFile={handleFile} />}
        </div>
      </div>
    </div>
  );
}
