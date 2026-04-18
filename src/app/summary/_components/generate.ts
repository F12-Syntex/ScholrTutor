import type { Student } from "@/lib/students";
import type { Subject } from "@/lib/subjects";
import {
  SESSION_SLOTS,
  formatSlotTime,
  type SessionLogEntry,
} from "@/lib/session-log";

export interface StudentSummary {
  name: string;
  reference: string;
  subject: string;
  currentGrade: string;
  predictedGrade: string;
  targetGrade: string;
  topicsCovered: string[];
  testResults: { name: string; score: string; percentage: string }[];
  notes: string[];
  overallComment: string;
}

export interface DaySummary {
  overview: string;
  students: StudentSummary[];
}

export function buildDayContext(
  dayLogs: SessionLogEntry[],
  students: Student[],
  subjects: Subject[],
): string {
  const lines: string[] = [];
  const allTopics = subjects.flatMap((s) => s.topics);

  const slotGroups: SessionLogEntry[][] = SESSION_SLOTS.map(() => []);
  for (const log of dayLogs) {
    const slot = log.sessionSlot ?? 0;
    if (slot >= 0 && slot < slotGroups.length) slotGroups[slot].push(log);
  }

  for (let i = 0; i < SESSION_SLOTS.length; i++) {
    const logs = slotGroups[i];
    if (logs.length === 0) continue;
    lines.push(`\n## ${SESSION_SLOTS[i].label} (${formatSlotTime(i)})`);
    for (const log of logs) {
      lines.push(`\nEntry: "${log.rawText}"`);
      if (log.parsedData) {
        for (const sd of log.parsedData.students) {
          const student = students.find((s) => s.id === sd.studentId);
          lines.push(
            `  Student: ${sd.studentName}${student ? ` (${student.referenceNumber})` : ""}`,
          );
          if (student) {
            const sub = subjects.find((s) => s.id === student.subjectId);
            if (sub) lines.push(`    Subject: ${sub.name}`);
            lines.push(
              `    Grades — Current: ${student.currentGrade || "N/A"}, Predicted: ${student.predictedGrade || "N/A"}, Target: ${student.targetGrade || "N/A"}`,
            );
          }
          for (const note of sd.notes) lines.push(`    Note: ${note}`);
          for (const tr of sd.testResults)
            lines.push(
              `    Test: ${tr.name} — ${tr.scoreGot}/${tr.scoreOf} (${Math.round((tr.scoreGot / tr.scoreOf) * 100)}%)`,
            );
          for (const tid of sd.topicIds) {
            const topic = allTopics.find((t) => t.id === tid);
            if (topic)
              lines.push(`    Topic covered: ${topic.code} ${topic.title}`);
          }
        }
      }
    }
  }
  return lines.join("\n");
}

export async function generateSummary(
  context: string,
  apiKey: string,
  model: string,
): Promise<DaySummary> {
  const systemPrompt = `You write tutoring daily reports. Given a day's session logs, produce a structured student-by-student summary.

Return ONLY valid JSON:
{
  "overview": "<1-2 sentence day overview>",
  "students": [
    {
      "name": "<student name>",
      "reference": "<reference number e.g. ST-001>",
      "subject": "<subject name>",
      "currentGrade": "<grade or empty>",
      "predictedGrade": "<grade or empty>",
      "targetGrade": "<grade or empty>",
      "topicsCovered": ["<topic code + title>"],
      "testResults": [{"name":"<test>","score":"<got>/<total>","percentage":"<n>%"}],
      "notes": ["<observation>"],
      "overallComment": "<brief progress comment>"
    }
  ]
}

Rules:
- Include every student mentioned in the logs
- Include reference numbers if available
- List ALL topics covered and ALL test results
- For test results, always include name, score fraction, and percentage
- Notes should be concise observations
- overallComment is a 1-2 sentence progress summary
- Grades should reflect what's in the data`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate the daily student summary:\n${context}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return valid JSON");
  return JSON.parse(match[0]) as DaySummary;
}
