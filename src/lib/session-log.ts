import type { Student } from "./students";
import type { Subject } from "./subjects";

export interface MentionToken {
  type: "student" | "topic";
  id: string;
  label: string;
}

export interface ParsedStudentData {
  studentId: string;
  studentName: string;
  notes: string[];
  testResults: { name: string; scoreGot: number; scoreOf: number }[];
  topicIds: string[];
  incrementSession: boolean;
}

export interface ParsedSessionData {
  students: ParsedStudentData[];
}

export interface SessionLogEntry {
  id: string;
  rawText: string;
  parsedData: ParsedSessionData | null;
  createdAt: string;
}

const LOG_KEY = "scholrtutor-session-logs";

export function loadSessionLogs(): SessionLogEntry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}

export function saveSessionLog(entry: SessionLogEntry) {
  const logs = loadSessionLogs();
  logs.unshift(entry);
  if (logs.length > 200) logs.length = 200;
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

export function extractMentions(text: string, students: Student[], subjects: Subject[]): MentionToken[] {
  const mentions: MentionToken[] = [];
  const allTopics = subjects.flatMap(sub => sub.topics);

  for (const m of text.matchAll(/@student:([^\n@]+?)(?=\s|$|@)/g)) {
    const name = m[1].trim();
    const s = students.find(st => st.name.toLowerCase() === name.toLowerCase());
    if (s) mentions.push({ type: "student", id: s.id, label: s.name });
  }
  for (const m of text.matchAll(/@topic:([^\n@]+?)(?=\s|$|@)/g)) {
    const label = m[1].trim();
    const t = allTopics.find(tp => `${tp.code} ${tp.title}`.toLowerCase() === label.toLowerCase() || tp.code === label);
    if (t) mentions.push({ type: "topic", id: t.id, label: `${t.code} ${t.title}` });
  }
  return mentions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseSessionLog(
  rawText: string,
  students: Student[],
  subjects: Subject[],
  apiKey: string,
  model: string,
): Promise<ParsedSessionData> {
  const studentList = students.map(s => `- "${s.name}" (id: ${s.id})`).join("\n");
  const topicList = subjects.flatMap(sub =>
    sub.topics.map(t => `- "${t.code} ${t.title}" (id: ${t.id})`)
  ).join("\n");

  const systemPrompt = `You parse tutoring session logs into structured data.

Students:
${studentList || "(none)"}

Topics:
${topicList || "(none)"}

Rules:
- Extract notes (observations about a student), test results (score/total), and topics covered
- "got 10/25", "scored 18/20", "full marks" → test results. "full marks" means scoreGot === scoreOf
- Set incrementSession: true if this log represents a completed session with the student
- Associate topics and scores with the nearest mentioned student
- If only one student is mentioned or implied, attribute everything to them

Return ONLY valid JSON:
{"students":[{"studentId":"<id>","studentName":"<name>","notes":["<text>"],"testResults":[{"name":"<description>","scoreGot":<n>,"scoreOf":<n>}],"topicIds":["<id>"],"incrementSession":true}]}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  const content = data.choices?.[0]?.message?.content ?? "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return valid JSON");

  const parsed = JSON.parse(match[0]) as ParsedSessionData;
  const validIds = new Set(students.map(s => s.id));
  parsed.students = (parsed.students || []).filter(s => validIds.has(s.studentId));
  return parsed;
}
