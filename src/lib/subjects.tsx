"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSubjects(subjects: Subject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

type SubjectsContextValue = {
  subjects: Subject[];
  addSubject: (data: Omit<Subject, "id" | "createdAt" | "topics">) => Subject;
  updateSubject: (id: string, data: Partial<Omit<Subject, "id" | "createdAt">>) => void;
  deleteSubject: (id: string) => void;
  addTopic: (subjectId: string, topic: Omit<Topic, "id">) => void;
  updateTopic: (subjectId: string, topicId: string, data: Partial<Omit<Topic, "id">>) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;
};

const SubjectsContext = createContext<SubjectsContextValue | null>(null);

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    setSubjects(loadSubjects());
  }, []);



  const addSubject = useCallback(
    (data: Omit<Subject, "id" | "createdAt" | "topics">) => {
      const subject: Subject = {
        ...data,
        id: generateId(),
        topics: [],
        createdAt: new Date().toISOString(),
      };
      setSubjects((prev) => {
        const next = [...prev, subject];
        saveSubjects(next);
        return next;
      });
      return subject;
    },
    []
  );

  const updateSubject = useCallback(
    (id: string, data: Partial<Omit<Subject, "id" | "createdAt">>) => {
      setSubjects((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
        saveSubjects(next);
        return next;
      });
    },
    []
  );

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveSubjects(next);
      return next;
    });
  }, []);

  const addTopic = useCallback(
    (subjectId: string, topic: Omit<Topic, "id">) => {
      setSubjects((prev) => {
        const next = prev.map((s) =>
          s.id === subjectId
            ? { ...s, topics: [...s.topics, { ...topic, id: generateId() }] }
            : s
        );
        saveSubjects(next);
        return next;
      });
    },
    []
  );

  const updateTopic = useCallback(
    (subjectId: string, topicId: string, data: Partial<Omit<Topic, "id">>) => {
      setSubjects((prev) => {
        const next = prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                topics: s.topics.map((t) =>
                  t.id === topicId ? { ...t, ...data } : t
                ),
              }
            : s
        );
        saveSubjects(next);
        return next;
      });
    },
    []
  );

  const deleteTopic = useCallback((subjectId: string, topicId: string) => {
    setSubjects((prev) => {
      const next = prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
          : s
      );
      saveSubjects(next);
      return next;
    });
  }, []);

  return (
    <SubjectsContext.Provider
      value={{
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        addTopic,
        updateTopic,
        deleteTopic,
      }}
    >
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
