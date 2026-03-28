"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface StudentNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  name: string;
  scoreGot: number;
  scoreOf: number;
  createdAt: string;
}

export interface Student {
  id: string;
  referenceNumber: string;
  name: string;
  email: string;
  icon: string;
  subjectId: string;
  currentGrade: string;
  predictedGrade: string;
  targetGrade: string;
  isRegular: boolean;
  isStarred: boolean;
  completedSessions: number;
  notes: StudentNote[];
  testResults: TestResult[];
  createdAt: string;
}

const STORAGE_KEY = "scholrtutor-students";

function generateId() {
  return crypto.randomUUID();
}

function loadStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // Migrate old data missing new fields
    return (JSON.parse(raw) as Student[]).map(s => ({
      ...s,
      icon: s.icon ?? "",
      isStarred: s.isStarred ?? false,
      completedSessions: s.completedSessions ?? 0,
      notes: s.notes ?? [],
      testResults: s.testResults ?? [],
    }));
  } catch {
    return [];
  }
}

function saveStudents(students: Student[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function generateReferenceNumber(existing: Student[]): string {
  const maxNum = existing.reduce((max, s) => {
    const match = s.referenceNumber.match(/^ST-(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `ST-${String(maxNum + 1).padStart(3, "0")}`;
}

type StudentsContextValue = {
  students: Student[];
  addStudent: (data: Omit<Student, "id" | "referenceNumber" | "createdAt" | "notes" | "testResults" | "completedSessions" | "isStarred">) => Student;
  updateStudent: (id: string, data: Partial<Omit<Student, "id" | "createdAt">>) => void;
  deleteStudent: (id: string) => void;
  addNote: (studentId: string, content: string) => void;
  deleteNote: (studentId: string, noteId: string) => void;
  addTestResult: (studentId: string, data: { name: string; scoreGot: number; scoreOf: number }) => void;
  deleteTestResult: (studentId: string, resultId: string) => void;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    setStudents(loadStudents());
  }, []);

  const addStudent = useCallback(
    (data: Omit<Student, "id" | "referenceNumber" | "createdAt" | "notes" | "testResults" | "completedSessions" | "isStarred">) => {
      let student: Student | undefined;
      setStudents((prev) => {
        student = {
          ...data,
          id: generateId(),
          referenceNumber: generateReferenceNumber(prev),
          isStarred: false,
          completedSessions: 0,
          notes: [],
          testResults: [],
          createdAt: new Date().toISOString(),
        };
        const next = [...prev, student];
        saveStudents(next);
        return next;
      });
      return student!;
    },
    []
  );

  const updateStudent = useCallback(
    (id: string, data: Partial<Omit<Student, "id" | "createdAt">>) => {
      setStudents((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...data } : s));
        saveStudents(next);
        return next;
      });
    },
    []
  );

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveStudents(next);
      return next;
    });
  }, []);

  const addNote = useCallback((studentId: string, content: string) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId
          ? { ...s, notes: [{ id: generateId(), content, createdAt: new Date().toISOString() }, ...s.notes] }
          : s
      );
      saveStudents(next);
      return next;
    });
  }, []);

  const deleteNote = useCallback((studentId: string, noteId: string) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId
          ? { ...s, notes: s.notes.filter((n) => n.id !== noteId) }
          : s
      );
      saveStudents(next);
      return next;
    });
  }, []);

  const addTestResult = useCallback((studentId: string, data: { name: string; scoreGot: number; scoreOf: number }) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId
          ? { ...s, testResults: [{ ...data, id: generateId(), createdAt: new Date().toISOString() }, ...s.testResults] }
          : s
      );
      saveStudents(next);
      return next;
    });
  }, []);

  const deleteTestResult = useCallback((studentId: string, resultId: string) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId
          ? { ...s, testResults: s.testResults.filter((r) => r.id !== resultId) }
          : s
      );
      saveStudents(next);
      return next;
    });
  }, []);

  return (
    <StudentsContext.Provider
      value={{ students, addStudent, updateStudent, deleteStudent, addNote, deleteNote, addTestResult, deleteTestResult }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudents must be used within StudentsProvider");
  return ctx;
}
