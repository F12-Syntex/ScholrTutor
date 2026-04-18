"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStudents } from "@/lib/students";
import { StudentDetail } from "./_components/student-detail";
import { StudentsList } from "./_components/students-list";

export default function StudentsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { students } = useStudents();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Honour ?id= deep-links every time the param changes.
  useEffect(() => {
    const id = params.get("id");
    if (id) {
      setSelectedId(id);
    }
  }, [params]);

  const selected = selectedId ? students.find((s) => s.id === selectedId) : null;

  const clearSelection = () => {
    setSelectedId(null);
    if (params.get("id")) router.replace("/students");
  };

  if (selected) {
    return <StudentDetail student={selected} onBack={clearSelection} />;
  }

  return <StudentsList onSelect={setSelectedId} />;
}
