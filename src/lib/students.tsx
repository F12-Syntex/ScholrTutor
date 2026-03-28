"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface Student {
  id: string;
  referenceNumber: string;
  name: string;
  email: string;
  subjectId: string;
  currentGrade: string;
  predictedGrade: string;
  targetGrade: string;
  isRegular: boolean;
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
    return raw ? JSON.parse(raw) : [];
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
  addStudent: (
    data: Omit<Student, "id" | "referenceNumber" | "createdAt">
  ) => Student;
  updateStudent: (
    id: string,
    data: Partial<Omit<Student, "id" | "referenceNumber" | "createdAt">>
  ) => void;
  deleteStudent: (id: string) => void;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    setStudents(loadStudents());
  }, []);

  const addStudent = useCallback(
    (data: Omit<Student, "id" | "referenceNumber" | "createdAt">) => {
      let student: Student | undefined;
      setStudents((prev) => {
        student = {
          ...data,
          id: generateId(),
          referenceNumber: generateReferenceNumber(prev),
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
    (
      id: string,
      data: Partial<Omit<Student, "id" | "referenceNumber" | "createdAt">>
    ) => {
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

  return (
    <StudentsContext.Provider
      value={{
        students,
        addStudent,
        updateStudent,
        deleteStudent,
      }}
    >
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
