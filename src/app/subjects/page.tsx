"use client";

import { useState } from "react";
import { useSubjects, type Subject, type GradeBoundary, type Topic } from "@/lib/subjects";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Trash } from "@phosphor-icons/react/dist/ssr/Trash";
import { PencilSimple } from "@phosphor-icons/react/dist/ssr/PencilSimple";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// ── Subject Form (Create / Edit) ──

const LEVELS = ["A-Level", "GCSE", "Other"] as const;

const DEFAULT_BOUNDARIES: GradeBoundary[] = [
  { grade: "A*", minPercent: 90 },
  { grade: "A", minPercent: 80 },
  { grade: "B", minPercent: 70 },
  { grade: "C", minPercent: 60 },
  { grade: "D", minPercent: 50 },
  { grade: "E", minPercent: 40 },
  { grade: "U", minPercent: 0 },
];

function SubjectForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Subject;
  onSubmit: (data: { name: string; examBoard: string; level: Subject["level"]; gradeBoundaries: GradeBoundary[] }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [examBoard, setExamBoard] = useState(initial?.examBoard ?? "");
  const [level, setLevel] = useState<Subject["level"]>(initial?.level ?? "A-Level");
  const [boundaries, setBoundaries] = useState<GradeBoundary[]>(
    initial?.gradeBoundaries?.length ? initial.gradeBoundaries : DEFAULT_BOUNDARIES
  );

  const updateBoundary = (idx: number, field: keyof GradeBoundary, value: string | number) => {
    setBoundaries((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b))
    );
  };

  const addBoundary = () => {
    setBoundaries((prev) => [...prev, { grade: "", minPercent: 0 }]);
  };

  const removeBoundary = (idx: number) => {
    setBoundaries((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="border border-border/50 rounded-lg p-5 space-y-5 bg-card">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="subject-name">Subject Name</Label>
          <Input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Economics"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="exam-board">Exam Board</Label>
          <Input
            id="exam-board"
            value={examBoard}
            onChange={(e) => setExamBoard(e.target.value)}
            placeholder="e.g. AQA, Edexcel, OCR"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Level</Label>
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                level === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Grade Boundaries</Label>
          <button
            onClick={addBoundary}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-1.5">
          {boundaries.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={b.grade}
                onChange={(e) => updateBoundary(i, "grade", e.target.value)}
                placeholder="Grade"
                className="w-20"
              />
              <span className="text-xs text-muted-foreground shrink-0">≥</span>
              <Input
                type="number"
                value={b.minPercent}
                onChange={(e) => updateBoundary(i, "minPercent", Number(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <button
                onClick={() => removeBoundary(i)}
                className="text-muted-foreground/50 hover:text-destructive transition-colors ml-auto"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={() => onSubmit({ name, examBoard, level, gradeBoundaries: boundaries })}
          disabled={!name.trim() || !examBoard.trim()}
          size="sm"
        >
          {initial ? "Save Changes" : "Create Subject"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Topic Tree ──

function TopicNode({
  topic,
  allTopics,
  subjectId,
  depth,
}: {
  topic: Topic;
  allTopics: Topic[];
  subjectId: string;
  depth: number;
}) {
  const { updateTopic, deleteTopic, addTopic } = useSubjects();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [adding, setAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const children = allTopics
    .filter((t) => t.parentCode === topic.code)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const hasChildren = children.length > 0;

  const handleSaveEdit = () => {
    updateTopic(subjectId, topic.id, { title: editTitle });
    setEditing(false);
  };

  const handleAddChild = () => {
    if (!newCode.trim() || !newTitle.trim()) return;
    addTopic(subjectId, { code: newCode, title: newTitle, parentCode: topic.code });
    setNewCode("");
    setNewTitle("");
    setAdding(false);
  };

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 py-1 px-1 -mx-1 rounded-md hover:bg-accent/30 transition-colors"
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground/50"
        >
          {hasChildren &&
            (expanded ? <CaretDown size={12} /> : <CaretRight size={12} />)}
        </button>

        <span className="text-xs font-mono text-muted-foreground shrink-0 w-10">
          {topic.code}
        </span>

        {editing ? (
          <div className="flex items-center gap-1.5 flex-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-6 text-sm py-0 flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              autoFocus
            />
            <button onClick={handleSaveEdit} className="text-xs text-primary hover:underline">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-muted-foreground hover:underline">
              Cancel
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm flex-1 truncate">{topic.title}</span>
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={() => setAdding(true)}
                className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Add child topic"
              >
                <Plus size={13} />
              </button>
              <button
                onClick={() => { setEditing(true); setEditTitle(topic.title); }}
                className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Edit"
              >
                <PencilSimple size={13} />
              </button>
              <button
                onClick={() => deleteTopic(subjectId, topic.id)}
                className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash size={13} />
              </button>
            </div>
          </>
        )}
      </div>

      {adding && (
        <div
          className="flex items-center gap-1.5 py-1 pl-4"
          style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}
        >
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Code"
            className="h-6 text-xs py-0 w-16 font-mono"
            autoFocus
          />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Topic title"
            className="h-6 text-xs py-0 flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddChild()}
          />
          <button onClick={handleAddChild} className="text-xs text-primary hover:underline shrink-0">
            Add
          </button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:underline shrink-0">
            Cancel
          </button>
        </div>
      )}

      {expanded &&
        children.map((child) => (
          <TopicNode
            key={child.id}
            topic={child}
            allTopics={allTopics}
            subjectId={subjectId}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

function TopicTree({ subject }: { subject: Subject }) {
  const { addTopic } = useSubjects();
  const [adding, setAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const rootTopics = subject.topics
    .filter((t) => !t.parentCode)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const handleAdd = () => {
    if (!newCode.trim() || !newTitle.trim()) return;
    addTopic(subject.id, { code: newCode, title: newTitle, parentCode: null });
    setNewCode("");
    setNewTitle("");
    setAdding(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Topic Tree
        </span>
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add root topic
        </button>
      </div>

      {rootTopics.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground/60 py-4 text-center">
          No topics yet. Add a root topic to get started.
        </p>
      )}

      {rootTopics.map((topic) => (
        <TopicNode
          key={topic.id}
          topic={topic}
          allTopics={subject.topics}
          subjectId={subject.id}
          depth={0}
        />
      ))}

      {adding && (
        <div className="flex items-center gap-1.5 py-1 px-1">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="e.g. 1"
            className="h-6 text-xs py-0 w-16 font-mono"
            autoFocus
          />
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Markets and Market Failure"
            className="h-6 text-xs py-0 flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} className="text-xs text-primary hover:underline shrink-0">
            Add
          </button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:underline shrink-0">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Subject Card ──

function SubjectCard({ subject }: { subject: Subject }) {
  const { deleteSubject, updateSubject } = useSubjects();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const topicCount = subject.topics.length;
  const boundaryDisplay = subject.gradeBoundaries
    .slice(0, 3)
    .map((b) => `${b.grade}: ${b.minPercent}%`)
    .join(", ");

  if (editing) {
    return (
      <SubjectForm
        initial={subject}
        onSubmit={(data) => {
          updateSubject(subject.id, data);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{subject.name}</h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
              {subject.level}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{subject.examBoard}</span>
            <span>·</span>
            <span>{topicCount} topic{topicCount !== 1 ? "s" : ""}</span>
            {boundaryDisplay && (
              <>
                <span>·</span>
                <span className="truncate">{boundaryDisplay}…</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors"
            title={expanded ? "Collapse" : "Expand topics"}
          >
            {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Edit subject"
          >
            <PencilSimple size={14} />
          </button>
          <button
            onClick={() => deleteSubject(subject.id)}
            className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors"
            title="Delete subject"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {/* Topic tree (expanded) */}
      {expanded && (
        <div className="border-t border-border/30 px-4 py-3">
          <TopicTree subject={subject} />
        </div>
      )}
    </div>
  );
}

// ── Page ──

export default function SubjectsPage() {
  const { subjects, addSubject } = useSubjects();
  const [creating, setCreating] = useState(false);

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-medium tracking-tight">
            Subjects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define subjects, exam boards, and topic trees.
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} size="sm" className="shrink-0">
            <Plus size={16} className="mr-1.5" />
            Add Subject
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {creating && (
          <SubjectForm
            onSubmit={(data) => {
              addSubject(data);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        )}

        {subjects.length === 0 && !creating && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">
              No subjects defined yet.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create your first subject to start building topic trees and grade boundaries.
            </p>
          </div>
        )}

        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
}
