"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDebouncedPersist } from "./use-debounced-persist";

export interface Topic {
  id: string;
  code: string;
  title: string;
  parentCode: string | null;
  content: string[];
}

export interface GradeBoundary {
  grade: string;
  minPercent: number;
}

export interface Subject {
  id: string;
  name: string;
  examBoard: string;
  level: "A-Level" | "GCSE" | "Other";
  gradeBoundaries: GradeBoundary[];
  topics: Topic[];
  createdAt: string;
}

const STORAGE_KEY = "scholrtutor-subjects";

function generateId() {
  return crypto.randomUUID();
}

function loadSubjects(): Subject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Subject[]) : [];
  } catch {
    return [];
  }
}

type SubjectsContextValue = {
  subjects: Subject[];
  addSubject: (data: Omit<Subject, "id" | "createdAt" | "topics">) => Subject;
  updateSubject: (
    id: string,
    data: Partial<Omit<Subject, "id" | "createdAt">>,
  ) => void;
  deleteSubject: (id: string) => void;
  addTopic: (subjectId: string, topic: Omit<Topic, "id">) => void;
  updateTopic: (
    subjectId: string,
    topicId: string,
    data: Partial<Omit<Topic, "id">>,
  ) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
};

const SubjectsContext = createContext<SubjectsContextValue | null>(null);

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSubjects(loadSubjects());
    setHydrated(true);
  }, []);

  useDebouncedPersist(STORAGE_KEY, subjects, hydrated);

  const addSubject = useCallback<SubjectsContextValue["addSubject"]>((data) => {
    const subject: Subject = {
      ...data,
      id: generateId(),
      topics: [],
      createdAt: new Date().toISOString(),
    };
    setSubjects((prev) => [...prev, subject]);
    return subject;
  }, []);

  const updateSubject = useCallback<SubjectsContextValue["updateSubject"]>(
    (id, data) => {
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
      );
    },
    [],
  );

  const deleteSubject = useCallback<SubjectsContextValue["deleteSubject"]>(
    (id) => {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    },
    [],
  );

  const addTopic = useCallback<SubjectsContextValue["addTopic"]>(
    (subjectId, topic) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, topics: [...s.topics, { ...topic, id: generateId() }] }
            : s,
        ),
      );
    },
    [],
  );

  const updateTopic = useCallback<SubjectsContextValue["updateTopic"]>(
    (subjectId, topicId, data) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                topics: s.topics.map((t) =>
                  t.id === topicId ? { ...t, ...data } : t,
                ),
              }
            : s,
        ),
      );
    },
    [],
  );

  const deleteTopic = useCallback<SubjectsContextValue["deleteTopic"]>(
    (subjectId, topicId) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
            : s,
        ),
      );
    },
    [],
  );

  const value = useMemo<SubjectsContextValue>(
    () => ({
      subjects,
      addSubject,
      updateSubject,
      deleteSubject,
      addTopic,
      updateTopic,
      deleteTopic,
    }),
    [
      subjects,
      addSubject,
      updateSubject,
      deleteSubject,
      addTopic,
      updateTopic,
      deleteTopic,
    ],
  );

  return (
    <SubjectsContext.Provider value={value}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  const ctx = useContext(SubjectsContext);
  if (!ctx)
    throw new Error("useSubjects must be used within SubjectsProvider");
  return ctx;
}
