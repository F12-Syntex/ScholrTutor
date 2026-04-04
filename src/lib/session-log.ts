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
}

export interface ParsedSessionData {
  students: ParsedStudentData[];
}

export interface SessionLogEntry {
  id: string;
  rawText: string;
  parsedData: ParsedSessionData | null;
  sessionSlot: number; // 0-3 index into SESSION_SLOTS
  createdAt: string;
}

// ── Session time slots ──

export const SESSION_SLOTS = [
  { label: "Session 1", start: "09:00", end: "11:00" },
  { label: "Session 2", start: "11:20", end: "13:20" },
  { label: "Session 3", start: "14:10", end: "16:10" },
  { label: "Session 4", start: "16:30", end: "18:30" },
] as const;

/** Convert "HH:MM" to minutes since midnight */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Resolve which session slot a timestamp belongs to.
 * If the time falls between slots, it's attributed to the previous slot.
 * Before slot 0 → slot 0. After slot 3 → slot 3.
 */
export function resolveSessionSlot(date: Date): number {
  const mins = date.getHours() * 60 + date.getMinutes();

  // Before first session starts → slot 0
  if (mins < toMinutes(SESSION_SLOTS[0].start)) return 0;

  // Check each slot
  for (let i = 0; i < SESSION_SLOTS.length; i++) {
    const slotStart = toMinutes(SESSION_SLOTS[i].start);
    const slotEnd = toMinutes(SESSION_SLOTS[i].end);
    if (mins >= slotStart && mins <= slotEnd) return i;
  }

  // Between slots: find which gap we're in → attribute to previous slot
  for (let i = 0; i < SESSION_SLOTS.length - 1; i++) {
    const thisEnd = toMinutes(SESSION_SLOTS[i].end);
    const nextStart = toMinutes(SESSION_SLOTS[i + 1].start);
    if (mins > thisEnd && mins < nextStart) return i;
  }

  // After last slot → last slot
  return SESSION_SLOTS.length - 1;
}

/** Format a slot's time range for display */
export function formatSlotTime(slotIndex: number): string {
  const slot = SESSION_SLOTS[slotIndex];
  if (!slot) return "";
  const fmt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };
  return `${fmt(slot.start)} – ${fmt(slot.end)}`;
}

/** Get date string as YYYY-MM-DD */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ── Storage ──

const LOG_KEY = "scholrtutor-session-logs";

export function loadSessionLogs(): SessionLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as SessionLogEntry[];
    // Migrate old entries missing sessionSlot
    return logs.map(l => ({
      ...l,
      sessionSlot: l.sessionSlot ?? resolveSessionSlot(new Date(l.createdAt)),
    }));
  } catch { return []; }
}

export function saveSessionLog(entry: SessionLogEntry) {
  const logs = loadSessionLogs();
  logs.unshift(entry);
  if (logs.length > 200) logs.length = 200;
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

// ── Mention extraction ──

export function extractMentions(text: string, students: Student[], subjects: Subject[]): MentionToken[] {
  const mentions: MentionToken[] = [];
  const allTopics = subjects.flatMap(sub => sub.topics);

  for (const m of text.matchAll(/@student\(([^)]+)\)/g)) {
    const name = m[1].trim();
    const s = students.find(st => st.name.toLowerCase() === name.toLowerCase());
    if (s) mentions.push({ type: "student", id: s.id, label: s.name });
  }
  for (const m of text.matchAll(/@topic\(([^)]+)\)/g)) {
    const label = m[1].trim();
    const t = allTopics.find(tp =>
      `${tp.code} ${tp.title}`.toLowerCase() === label.toLowerCase() ||
      tp.code === label.split(" ")[0]
    );
    if (t) mentions.push({ type: "topic", id: t.id, label: `${t.code} ${t.title}` });
  }
  for (const m of text.matchAll(/@student:([^\n@]+?)(?=\s|$|@)/g)) {
    const name = m[1].trim();
    const s = students.find(st => st.name.toLowerCase() === name.toLowerCase());
    if (s && !mentions.some(x => x.id === s.id)) mentions.push({ type: "student", id: s.id, label: s.name });
  }
  for (const m of text.matchAll(/@topic:([^\n@]+?)(?=\s|$|@)/g)) {
    const label = m[1].trim();
    const t = allTopics.find(tp => `${tp.code} ${tp.title}`.toLowerCase() === label.toLowerCase() || tp.code === label);
    if (t && !mentions.some(x => x.id === t.id)) mentions.push({ type: "topic", id: t.id, label: `${t.code} ${t.title}` });
  }
  return mentions;
}

// ── AI parsing ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseSessionLog(
  rawText: string,
  students: Student[],
  subjects: Subject[],
  apiKey: string,
  model: string,
): Promise<ParsedSessionData> {
  const studentList = students.map(s => {
    const sub = subjects.find(sub => sub.id === s.subjectId);
    return `- "${s.name}" (id: ${s.id}${sub ? `, subject: "${sub.name}"` : ""})`;
  }).join("\n");

  const topicList = subjects.map(sub => {
    const topics = sub.topics.map(t => `  - "${t.code} ${t.title}" (id: ${t.id})`).join("\n");
    return `[${sub.name}]\n${topics}`;
  }).join("\n\n");

  const systemPrompt = `You parse tutoring session logs into structured data.

Students (with their assigned subjects):
${studentList || "(none)"}

Topics (grouped by subject):
${topicList || "(none)"}

Rules:
- Extract notes (observations about a student), test results (score/total), and topics covered
- "got 10/25", "scored 18/20", "full marks" → test results. "full marks" means scoreGot === scoreOf
- Associate topics and scores with the nearest mentioned student
- If only one student is mentioned or implied, attribute everything to them
- CRITICAL: When matching topics, check what subject the student is studying and ONLY use topics from THAT subject
- If a student studies Economics, only match Economics topics — never assign topics from a different subject
- Auto-detect students from the database by name even if not explicitly @mentioned

Return ONLY valid JSON:
{"students":[{"studentId":"<id>","studentName":"<name>","notes":["<text>"],"testResults":[{"name":"<description>","scoreGot":<n>,"scoreOf":<n>}],"topicIds":["<id>"]}]}`;

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
