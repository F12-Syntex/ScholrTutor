import type { Subject } from "@/lib/subjects";

export function exportSubjectJson(subject: Subject) {
  const roots = subject.topics
    .filter((t) => !t.parentCode)
    .sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true }),
    );
  const data = {
    name: subject.name,
    examBoard: subject.examBoard,
    level: subject.level,
    units: roots.map((root) => ({
      code: root.code,
      title: root.title,
      topics: subject.topics
        .filter((t) => t.parentCode === root.code)
        .sort((a, b) =>
          a.code.localeCompare(b.code, undefined, { numeric: true }),
        )
        .map((t) => ({ code: t.code, title: t.title })),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${subject.name.toLowerCase().replace(/\s+/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
