// Generates a ScholrTutor backup JSON from data.txt + test1.json subjects
// Run: node scripts/seed.mjs > scholrtutor-seed-backup.json

import { randomUUID } from "crypto";
import { readFileSync } from "fs";

// ── Load subjects from test1.json (the 4 real subject specs) ──

const test1 = JSON.parse(readFileSync("test1.json", "utf8"));
const subjects = test1["scholrtutor-subjects"];

// Subject IDs
const OCR_ECON = subjects.find(s => s.examBoard === "OCR").id;
const EDEXCEL_BIZ = subjects.find(s => s.examBoard === "Pearson").id;
const AQA_ECON = subjects.find(s => s.examBoard === "AQA").id;
const EDEXCEL_ECON = subjects.find(s => s.examBoard === "Edexcel").id;

// Map student board+level to one of the 4 subjects
function resolveSubjectId(board, level, notes) {
  const b = (board || "").toLowerCase();
  const l = (level || "").toLowerCase();
  const n = (notes || "").toLowerCase();

  // Business students → Edexcel Business
  if (n.includes("business") || l.includes("business")) return EDEXCEL_BIZ;

  if (b.includes("ocr") || b.includes("ocl")) return OCR_ECON;
  if (b.includes("aqa")) return AQA_ECON;
  if (b.includes("edexcel")) return EDEXCEL_ECON;

  return null; // no match → skip this student
}

// ── Raw student data from data.txt ──

const rawStudents = [
  { name: "Hayat", ref: "rt0029", email: "hayatabdi2005@icloud.com", board: "AQA", level: "A-Level", notes: "" },
  { name: "Ebamiyo", ref: "te117", email: "", board: "OCL", level: "", notes: "" },
  { name: "Cataline", ref: "a3806", email: "catalinacircu07@gmail.com", board: "Edexcel", level: "", notes: "" },
  { name: "Bianca", ref: "83a24", email: "bia.mano1225@gmail.com", board: "Edexcel", level: "", notes: "" },
  { name: "Waseela H", ref: "h0053", email: "", board: "Edexcel", level: "IGCSE", notes: "" },
  { name: "Israa", ref: "", email: "", board: "AQA", level: "A-Level", notes: "Sunday student" },
  { name: "Fatima", ref: "usfl486", email: "", board: "Edexcel", level: "International A-Level", notes: "" },
  { name: "Temi", ref: "a3742", email: "", board: "Edexcel", level: "A-Level", notes: "" },
  { name: "Ali", ref: "8447", email: "", board: "AQA", level: "A-Level", notes: "" },
  { name: "Vithun", ref: "a3a62", email: "", board: "Edexcel", level: "A-Level", notes: "" },
  { name: "Isra", ref: "a3740", email: "", board: "Edexcel", level: "", notes: "" },
  { name: "Joseph", ref: "g7697", email: "josephamissah804@gmail.com", board: "Edexcel", level: "A-Level", notes: "" },
  { name: "Yusuf", ref: "6406", email: "", board: "AQA", level: "GCSE", notes: "" },
  { name: "Tahiya", ref: "a3871", email: "", board: "AQA", level: "A-Level", notes: "Sunday student" },
  { name: "Muhsin", ref: "g7338", email: "", board: "AQA", level: "A-Level", notes: "" },
  { name: "Yasser", ref: "7435", email: "", board: "Edexcel", level: "A-Level", notes: "Done AS and year 1 content" },
  { name: "Amira", ref: "10279", email: "", board: "Edexcel", level: "A-Level", notes: "Micro finished year 1" },
  { name: "Daniel", ref: "g6417", email: "", board: "AQA", level: "A-Level", notes: "Doing supply side policies" },
  { name: "Samiyo", ref: "", email: "", board: "Edexcel", level: "A-Level", notes: "" },
  { name: "Sulaiman", ref: "g7613", email: "", board: "OCR", level: "GCSE", notes: "" },
  { name: "Aniello", ref: "10372", email: "", board: "Edexcel", level: "A-Level", notes: "In the start of year 2" },
  { name: "Jumal", ref: "a3907", email: "", board: "AQA", level: "A-Level", notes: "" },
  { name: "Hakim", ref: "a3890", email: "", board: "Edexcel", level: "A-Level", notes: "Theme 1/2 done, starting market structures" },
  { name: "Zaynab", ref: "g7364", email: "", board: "Edexcel", level: "AS-Level", notes: "" },
  { name: "Liban", ref: "usfl484", email: "", board: "Edexcel", level: "A-Level", notes: "Starting business AS level. Business student." },
  { name: "Rahma", ref: "a3740", email: "rahmamohamud2008@gmail.com", board: "AQA", level: "A-Level", notes: "Economics" },
  { name: "Danielle", ref: "8771", email: "", board: "Edexcel", level: "A-Level", notes: "" },
  { name: "Abyan", ref: "83932", email: "", board: "Edexcel", level: "A-Level", notes: "Business student" },
  { name: "Deniz", ref: "g7422", email: "", board: "AQA", level: "AS", notes: "Economics" },
  { name: "Janiya", ref: "", email: "", board: "Edexcel", level: "AS", notes: "Economics, market failure / macro objectives" },
  { name: "Jenny", ref: "g6417", email: "", board: "Edexcel", level: "AS", notes: "Economics macro - components of AD" },
  { name: "Duru", ref: "a3952", email: "", board: "AQA", level: "AS", notes: "Micro 1.1+1.3, macro monetary policies. 2 hours" },
  { name: "Ayaan", ref: "a3696a", email: "", board: "Edexcel", level: "AS", notes: "Just started economics. 4 hours" },
  { name: "Waseela W", ref: "g6721", email: "waseelaweli@gmail.com", board: "OCL", level: "AS", notes: "Micro done except market failure. Macro done except inflation/govt intervention. Need international trade. 4 hours" },
  { name: "Afra", ref: "a3861", email: "", board: "Edexcel", level: "", notes: "All of micro and bit macro" },
];

// ── Build students, skipping those with no matching subject ──

let autoRef = 0;
const students = [];

for (const r of rawStudents) {
  const subjectId = resolveSubjectId(r.board, r.level, r.notes);
  if (!subjectId) continue; // skip — doesn't fall under one of the 4 subjects

  autoRef++;
  const notes = [];
  if (r.notes) {
    notes.push({ id: randomUUID(), content: r.notes, createdAt: "2025-09-01T00:00:00.000Z" });
  }

  students.push({
    id: randomUUID(),
    referenceNumber: r.ref || `ST-${String(autoRef).padStart(3, "0")}`,
    name: r.name,
    email: r.email || "",
    icon: "",
    subjectId,
    currentGrade: "",
    predictedGrade: "",
    targetGrade: "",
    isRegular: false,
    completedSessions: 0,
    notes,
    testResults: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  });
}

// ── Add test results + session notes ──

function find(name) { return students.find(s => s.name.toLowerCase() === name.toLowerCase()); }

function addNote(name, content, date) {
  const s = find(name);
  if (!s) return;
  s.notes.push({ id: randomUUID(), content, createdAt: new Date(date).toISOString() });
  s.completedSessions++;
}

function addTest(name, testName, got, of, date) {
  const s = find(name);
  if (!s) return;
  s.testResults.push({ id: randomUUID(), name: testName, scoreGot: got, scoreOf: of, createdAt: new Date(date).toISOString() });
}

// 21/12/2025
addTest("Rahma", "Balance of payments", 9, 10, "2025-12-21");
addTest("Rahma", "Exchange rates", 10, 10, "2025-12-21");
addTest("Liban", "Mock on 1.2 The market", 15, 18, "2025-12-21");
addTest("Liban", "Pricing strategies", 6, 10, "2025-12-21");
addTest("Abyan", "Mock on 1.2 The market", 15, 18, "2025-12-21");
addTest("Abyan", "Pricing strategies", 10, 10, "2025-12-21");

// 28/12/2025
addNote("Abyan", "Marketing mix and strategies - finished all of 1.3", "2025-12-28");
addNote("Rahma", "10/13 did good overall, needed more analysis on the 8 marker. Doing 4.2 poverty and inequality, worksheet given.", "2025-12-28");
addTest("Rahma", "Topic test", 10, 13, "2025-12-28");

// 03/01/2026
addNote("Abyan", "Went over 1.4 content. Now doing a full 1.4 Managing People mock.", "2026-01-03");
addNote("Liban", "Went over leadership content. Now doing a full 1.4 Managing People mock.", "2026-01-03");
addNote("Rahma", "Completed Contestable Markets.", "2026-01-03");
addTest("Rahma", "15-marker contestable markets", 11, 15, "2026-01-03");

// 04/01/2026
addNote("Liban", "Doing unit 1.3 mock. Came an hour late due to traffic. Poor reasoning and analysis on staffing test.", "2026-01-04");
addTest("Liban", "1.4.1 Approaches to staffing", 2, 6, "2026-01-04");
addTest("Rahma", "4.3.1 Measures of development", 5, 5, "2026-01-04");
addTest("Rahma", "4.3.2 Factors influencing growth and development", 9, 15, "2026-01-04");
addTest("Daniel", "4.3.1 Measures of development", 4, 5, "2026-01-04");
addNote("Daniel", "4.3.2 Factors influencing growth and development — practice questions given.", "2026-01-04");

// 15/03/2026
addNote("Rahma", "Did monopolies. Did well, but needs more analysis and evaluation structure.", "2026-03-15");
addTest("Rahma", "Monopoly test", 21, 28, "2026-03-15");
addTest("Liban", "Roles of entrepreneurs MCQ", 9, 10, "2026-03-15");

// 22/03/2026
addTest("Rahma", "4.1.5.10 Market Structure, Static/Dynamic Efficiency", 19, 26, "2026-03-22");
addNote("Rahma", "Wrong monopsony definition on 4-marker. 10-marker had incomplete analysis chains. Finished 4.1.5.10.", "2026-03-22");
addNote("Abyan", "Practice questions on 1.5.1 Role of an entrepreneur. ~30 min late.", "2026-03-22");
addNote("Jumal", "Came ~40 minutes late and asked to do a mock test.", "2026-03-22");
addNote("Waseela W", "Covered all elasticities. Didn't attempt 6 marker properly, 2 MCQ mistakes. Started and finished market failure.", "2026-03-22");
addTest("Waseela W", "Elasticities topic test", 12, 18, "2026-03-22");
addNote("Ayaan", "Covered all elasticities. Started market failure.", "2026-03-22");
addTest("Ayaan", "Elasticities topic test", 6, 16, "2026-03-22");

// ── Output ──

const output = {
  _export: "scholrtutor",
  _version: "2.4",
  _date: new Date().toISOString(),
  "scholrtutor-subjects": subjects,
  "scholrtutor-students": students,
  "scholrtutor-session-logs": [],
  "scholrtutor-settings": null,
};

console.log(JSON.stringify(output, null, 2));
