"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { useSubjects, type Subject, type Topic } from "@/lib/subjects";
import { useBreadcrumb } from "@/lib/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubjectActions } from "./subject-actions";
import { TreeToggle } from "./tree-toggle";

export function SubjectDetail({
  subject,
  onBack,
}: {
  subject: Subject;
  onBack: () => void;
}) {
  const { deleteSubject, updateSubject } = useSubjects();
  const { setSubtitle } = useBreadcrumb();

  useEffect(() => {
    setSubtitle(subject.name);
    return () => setSubtitle(null);
  }, [subject.name, setSubtitle]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(subject.name);
  const [topicSearch, setTopicSearch] = useState("");
  const [expandKey, setExpandKey] = useState(0);
  const [defaultExpanded, setDefaultExpanded] = useState(true);

  const roots = useMemo(
    () =>
      subject.topics
        .filter((t) => !t.parentCode)
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true }),
        ),
    [subject.topics],
  );

  const q = topicSearch.toLowerCase();
  const filteredRoots = !q
    ? roots
    : roots.filter(
        (root) =>
          root.title.toLowerCase().includes(q) ||
          root.code.toLowerCase().includes(q) ||
          subject.topics.some(
            (t) =>
              t.parentCode === root.code &&
              (t.title.toLowerCase().includes(q) ||
                t.code.toLowerCase().includes(q)),
          ),
      );

  const openRename = () => {
    setRenameValue(subject.name);
    setRenameOpen(true);
  };
  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== subject.name) {
      updateSubject(subject.id, { name: trimmed });
    }
    setRenameOpen(false);
  };

  return (
    <div className="flex h-full flex-col p-4 sm:p-8">
      <div className="shrink-0">
        <button
          onClick={onBack}
          className="group mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:text-foreground"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-0.5"
          />
          Back
        </button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {subject.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <span>{subject.examBoard}</span>
              <span aria-hidden>·</span>
              <span>{subject.level}</span>
              <span aria-hidden>·</span>
              <span>
                {roots.length} units · {subject.topics.length} topics
              </span>
            </p>
          </div>
          <SubjectActions
            subject={subject}
            onDelete={() => {
              deleteSubject(subject.id);
              onBack();
            }}
            onRename={openRename}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <MagnifyingGlass
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
            placeholder="Search topics…"
            aria-label="Search topics"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDefaultExpanded(true);
              setExpandKey((k) => k + 1);
            }}
          >
            Expand all
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDefaultExpanded(false);
              setExpandKey((k) => k + 1);
            }}
          >
            Collapse all
          </Button>
        </div>
      </div>

      <div className="scroll-panel mt-5 flex-1 min-h-0 overflow-auto">
        {filteredRoots.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {q
              ? "No topics match your search."
              : "No topics defined for this subject."}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredRoots.map((root) => (
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

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename subject</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            autoFocus
            aria-label="Subject name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailUnit({
  root,
  allTopics,
  search,
  defaultExpanded,
}: {
  root: Topic;
  allTopics: Topic[];
  search: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isSearching = search.length > 0;

  const children = allTopics
    .filter((t) => t.parentCode === root.code)
    .sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    );

  const filteredChildren = !isSearching
    ? children
    : children.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.code.toLowerCase().includes(search),
      );

  const isExpanded = isSearching ? true : expanded;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 bg-muted/70 px-4 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
      >
        <TreeToggle expanded={isExpanded} size={18} />
        <span className="font-mono text-xs text-muted-foreground">{root.code}</span>
        <span className="text-sm font-medium tracking-tight">{root.title}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredChildren.length}
          {isSearching && filteredChildren.length !== children.length
            ? `/${children.length}`
            : ""}{" "}
          {children.length === 1 ? "topic" : "topics"}
        </span>
      </button>

      {isExpanded && filteredChildren.length > 0 && (
        <div className="border-t border-border bg-card px-4 py-2">
          {filteredChildren.map((child) => (
            <DetailTopic
              key={child.id}
              topic={child}
              allTopics={allTopics}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailTopic({
  topic,
  allTopics,
  search,
}: {
  topic: Topic;
  allTopics: Topic[];
  search: string;
}) {
  const children = allTopics
    .filter((t) => t.parentCode === topic.code)
    .sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;
  const isSearching = search.length > 0;

  const filteredChildren = !isSearching
    ? children
    : children.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.code.toLowerCase().includes(search),
      );

  const Wrapper = hasChildren ? "button" : "div";

  return (
    <div>
      <Wrapper
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
        aria-expanded={hasChildren ? expanded : undefined}
        className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
          hasChildren ? "hover:bg-accent/60" : ""
        }`}
      >
        {hasChildren ? (
          <TreeToggle expanded={expanded} size={14} />
        ) : (
          <span
            aria-hidden
            className="flex w-3.5 shrink-0 items-center justify-center"
          >
            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
          </span>
        )}
        <span className="font-mono text-xs text-muted-foreground">{topic.code}</span>
        <span className="text-sm text-foreground/85">{topic.title}</span>
        {hasChildren && (
          <span className="ml-auto text-xs text-muted-foreground">
            {filteredChildren.length}
          </span>
        )}
      </Wrapper>
      {expanded && hasChildren && (
        <div className="ml-2 border-l border-border pl-4">
          {filteredChildren.map((child) => (
            <DetailTopic
              key={child.id}
              topic={child}
              allTopics={allTopics}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}
