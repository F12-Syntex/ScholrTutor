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
    return (JSON.parse(raw) as Student[]).map((s) => ({
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

function generateReferenceNumber(existing: Student[]): string {
  const maxNum = existing.reduce((max, s) => {
    const match = s.referenceNumber.match(/^ST-(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return `ST-${String(maxNum + 1).padStart(3, "0")}`;
}

type StudentsContextValue = {
  students: Student[];
  addStudent: (
    data: Omit<
      Student,
      | "id"
      | "referenceNumber"
      | "createdAt"
      | "notes"
      | "testResults"
      | "completedSessions"
      | "isStarred"
    >,
  ) => Student;
  updateStudent: (
    id: string,
    data: Partial<Omit<Student, "id" | "createdAt">>,
  ) => void;
  deleteStudent: (id: string) => void;
  addNote: (studentId: string, content: string) => void;
  deleteNote: (studentId: string, noteId: string) => void;
  addTestResult: (
    studentId: string,
    data: { name: string; scoreGot: number; scoreOf: number },
  ) => void;
  deleteTestResult: (studentId: string, resultId: string) => void;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStudents(loadStudents());
    setHydrated(true);
  }, []);

  useDebouncedPersist(STORAGE_KEY, students, hydrated);

  const addStudent = useCallback<StudentsContextValue["addStudent"]>((data) => {
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
      return [...prev, student];
    });
    return student!;
  }, []);

  const updateStudent = useCallback<StudentsContextValue["updateStudent"]>(
    (id, data) => {
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
      );
    },
    [],
  );

  const deleteStudent = useCallback<StudentsContextValue["deleteStudent"]>(
    (id) => {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    },
    [],
  );

  const addNote = useCallback<StudentsContextValue["addNote"]>(
    (studentId, content) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                notes: [
                  {
                    id: generateId(),
                    content,
                    createdAt: new Date().toISOString(),
                  },
                  ...s.notes,
                ],
              }
            : s,
        ),
      );
    },
    [],
  );

  const deleteNote = useCallback<StudentsContextValue["deleteNote"]>(
    (studentId, noteId) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? { ...s, notes: s.notes.filter((n) => n.id !== noteId) }
            : s,
        ),
      );
    },
    [],
  );

  const addTestResult = useCallback<StudentsContextValue["addTestResult"]>(
    (studentId, data) => {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                testResults: [
                  {
                    ...data,
                    id: generateId(),
                    createdAt: new Date().toISOString(),
                  },
                  ...s.testResults,
                ],
              }
            : s,
        ),
      );
    },
    [],
  );

  const deleteTestResult = useCallback<
    StudentsContextValue["deleteTestResult"]
  >((studentId, resultId) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              testResults: s.testResults.filter((r) => r.id !== resultId),
            }
          : s,
      ),
    );
  }, []);

  const value = useMemo<StudentsContextValue>(
    () => ({
      students,
      addStudent,
      updateStudent,
      deleteStudent,
      addNote,
      deleteNote,
      addTestResult,
      deleteTestResult,
    }),
    [
      students,
      addStudent,
      updateStudent,
      deleteStudent,
      addNote,
      deleteNote,
      addTestResult,
      deleteTestResult,
    ],
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx)
    throw new Error("useStudents must be used within StudentsProvider");
  return ctx;
}
