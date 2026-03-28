// Generates a ScholrTutor backup JSON from data.txt
// Run: node scripts/seed.mjs > seed-backup.json
// Then import via Settings > Data & About > Import

import { randomUUID } from "crypto";

// ── Subjects ──

const subjects = [
  {
    id: randomUUID(),
    name: "AQA Economics A-Level",
    examBoard: "AQA",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A*", minPercent: 90 }, { grade: "A", minPercent: 80 },
      { grade: "B", minPercent: 70 }, { grade: "C", minPercent: 60 },
      { grade: "D", minPercent: 50 }, { grade: "E", minPercent: 40 },
      { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "Edexcel Economics A-Level",
    examBoard: "Edexcel",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A*", minPercent: 90 }, { grade: "A", minPercent: 80 },
      { grade: "B", minPercent: 70 }, { grade: "C", minPercent: 60 },
      { grade: "D", minPercent: 50 }, { grade: "E", minPercent: 40 },
      { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "Edexcel Economics AS-Level",
    examBoard: "Edexcel",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A", minPercent: 80 }, { grade: "B", minPercent: 70 },
      { grade: "C", minPercent: 60 }, { grade: "D", minPercent: 50 },
      { grade: "E", minPercent: 40 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "AQA Economics AS-Level",
    examBoard: "AQA",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A", minPercent: 80 }, { grade: "B", minPercent: 70 },
      { grade: "C", minPercent: 60 }, { grade: "D", minPercent: 50 },
      { grade: "E", minPercent: 40 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "AQA Economics GCSE",
    examBoard: "AQA",
    level: "GCSE",
    gradeBoundaries: [
      { grade: "9", minPercent: 90 }, { grade: "8", minPercent: 80 },
      { grade: "7", minPercent: 70 }, { grade: "6", minPercent: 60 },
      { grade: "5", minPercent: 50 }, { grade: "4", minPercent: 40 },
      { grade: "3", minPercent: 30 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "OCR Economics GCSE",
    examBoard: "OCR",
    level: "GCSE",
    gradeBoundaries: [
      { grade: "9", minPercent: 90 }, { grade: "8", minPercent: 80 },
      { grade: "7", minPercent: 70 }, { grade: "6", minPercent: 60 },
      { grade: "5", minPercent: 50 }, { grade: "4", minPercent: 40 },
      { grade: "3", minPercent: 30 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "OCL Economics AS-Level",
    examBoard: "OCL",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A", minPercent: 80 }, { grade: "B", minPercent: 70 },
      { grade: "C", minPercent: 60 }, { grade: "D", minPercent: 50 },
      { grade: "E", minPercent: 40 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "Edexcel Economics International A-Level",
    examBoard: "Edexcel",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A*", minPercent: 90 }, { grade: "A", minPercent: 80 },
      { grade: "B", minPercent: 70 }, { grade: "C", minPercent: 60 },
      { grade: "D", minPercent: 50 }, { grade: "E", minPercent: 40 },
      { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "Edexcel Economics IGCSE",
    examBoard: "Edexcel",
    level: "GCSE",
    gradeBoundaries: [
      { grade: "9", minPercent: 90 }, { grade: "8", minPercent: 80 },
      { grade: "7", minPercent: 70 }, { grade: "6", minPercent: 60 },
      { grade: "5", minPercent: 50 }, { grade: "4", minPercent: 40 },
      { grade: "3", minPercent: 30 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "Edexcel Business A-Level",
    examBoard: "Edexcel",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A*", minPercent: 90 }, { grade: "A", minPercent: 80 },
      { grade: "B", minPercent: 70 }, { grade: "C", minPercent: 60 },
      { grade: "D", minPercent: 50 }, { grade: "E", minPercent: 40 },
      { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
  {
    id: randomUUID(),
    name: "Edexcel Business AS-Level",
    examBoard: "Edexcel",
    level: "A-Level",
    gradeBoundaries: [
      { grade: "A", minPercent: 80 }, { grade: "B", minPercent: 70 },
      { grade: "C", minPercent: 60 }, { grade: "D", minPercent: 50 },
      { grade: "E", minPercent: 40 }, { grade: "U", minPercent: 0 },
    ],
    topics: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  },
];

function findSubject(board, level) {
  const b = (board || "").toLowerCase();
  const l = (level || "").toLowerCase();
  // Business subjects
  if (l.includes("business")) {
    if (l.includes("as")) return subjects.find(s => s.name.includes("Business AS"));
    return subjects.find(s => s.name.includes("Business A-Level"));
  }
  if (b.includes("ocl")) return subjects.find(s => s.name.includes("OCL"));
  if (b.includes("ocr")) return subjects.find(s => s.name.includes("OCR"));
  if (b.includes("aqa")) {
    if (l.includes("gcse")) return subjects.find(s => s.name === "AQA Economics GCSE");
    if (l.includes("as")) return subjects.find(s => s.name === "AQA Economics AS-Level");
    return subjects.find(s => s.name === "AQA Economics A-Level");
  }
  if (b.includes("edexcel")) {
    if (l.includes("igcse")) return subjects.find(s => s.name.includes("IGCSE"));
    if (l.includes("international")) return subjects.find(s => s.name.includes("International"));
    if (l.includes("gcse")) return subjects.find(s => s.name.includes("Edexcel Economics GCSE") || s.name.includes("IGCSE"));
    if (l.includes("as")) return subjects.find(s => s.name === "Edexcel Economics AS-Level");
    return subjects.find(s => s.name === "Edexcel Economics A-Level");
  }
  return null;
}

// ── Students from data.txt table ──

const rawStudents = [
  { name: "Hamad", ref: "83774", email: "haamidhaamidhaamid@gmail.com", board: "", level: "", notes: "" },
  { name: "Hayat", ref: "rt0029", email: "hayatabdi2005@icloud.com", board: "AQA", level: "A-Level", notes: "" },
  { name: "Iman", ref: "8602", email: "imaninyaat2406@hotmail.com", board: "", level: "", notes: "" },
  { name: "Ezraasu", ref: "g642", email: "ezraasumadu@gmail.com", board: "", level: "", notes: "" },
  { name: "Keli", ref: "9498", email: "kelikjay@gmail.com", board: "", level: "", notes: "" },
  { name: "Somaya", ref: "g7329", email: "sumeyam9505@gmail.com", board: "", level: "", notes: "" },
  { name: "Ebamiyo", ref: "te117", email: "", board: "OCL", level: "", notes: "" },
  { name: "Abdikhaoiq", ref: "g6709", email: "agadeer@cityacademy.co.uk", board: "", level: "", notes: "" },
  { name: "Ebamiyosanu", ref: "", email: "ebamiyosanu@gmail.com", board: "", level: "", notes: "" },
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
  { name: "Yusran", ref: "usfl584", email: "", board: "", level: "", notes: "" },
  { name: "Aniello", ref: "10372", email: "", board: "Edexcel", level: "A-Level", notes: "In the start of year 2" },
  { name: "Afra", ref: "a3861", email: "", board: "", level: "", notes: "All of micro and bit macro" },
  { name: "Jumal", ref: "a3907", email: "", board: "AQA", level: "A-Level", notes: "" },
  { name: "Hakim", ref: "a3890", email: "", board: "Edexcel", level: "A-Level", notes: "Theme 1/2 done, starting market structures" },
  { name: "Zaynab", ref: "g7364", email: "", board: "Edexcel", level: "AS-Level", notes: "" },
  { name: "Liban", ref: "usfl484", email: "", board: "Edexcel", level: "AS business", notes: "Starting business AS level" },
  { name: "Rahma", ref: "a3740", email: "rahmamohamud2008@gmail.com", board: "AQA", level: "A-Level", notes: "Economics" },
  { name: "Danielle", ref: "8771", email: "", board: "Edexcel", level: "A-Level", notes: "" },
  { name: "Abyan", ref: "83932", email: "", board: "Edexcel", level: "A-Level business", notes: "Business" },
  { name: "Deniz", ref: "g7422", email: "", board: "AQA", level: "AS", notes: "Economics" },
  { name: "Janiya", ref: "", email: "", board: "Edexcel", level: "AS", notes: "Economics, market failure / macro objectives" },
  { name: "Jenny", ref: "g6417", email: "", board: "Edexcel", level: "AS", notes: "Economics macro - components of AD" },
  { name: "Duru", ref: "a3952", email: "", board: "AQA", level: "AS", notes: "Micro 1.1+1.3, macro monetary policies. 2 hours" },
  { name: "Ayaan", ref: "a3696a", email: "", board: "Edexcel", level: "AS", notes: "Just started economics. 4 hours" },
  { name: "Waseela W", ref: "g6721", email: "waseelaweli@gmail.com", board: "OCL", level: "AS", notes: "Micro done except market failure. Macro done except inflation/govt intervention. Need international trade. 4 hours" },
];

// ── Build student records ──

let refCounter = 0;
const students = rawStudents.map((r) => {
  refCounter++;
  const sub = findSubject(r.board, r.level);

  const notes = [];
  if (r.notes) {
    notes.push({ id: randomUUID(), content: r.notes, createdAt: "2025-09-01T00:00:00.000Z" });
  }

  return {
    id: randomUUID(),
    referenceNumber: r.ref || `ST-${String(refCounter).padStart(3, "0")}`,
    name: r.name,
    email: r.email || "",
    icon: "",
    subjectId: sub ? sub.id : "",
    currentGrade: "",
    predictedGrade: "",
    targetGrade: "",
    isRegular: false,
    completedSessions: 0,
    notes,
    testResults: [],
    createdAt: "2025-09-01T00:00:00.000Z",
  };
});

// ── Add test results + session notes from the log entries ──

function findStudent(name) {
  const n = name.toLowerCase().trim();
  return students.find(s => s.name.toLowerCase() === n);
}

function addNote(studentName, content, date) {
  const s = findStudent(studentName);
  if (!s) return;
  s.notes.push({ id: randomUUID(), content, createdAt: new Date(date).toISOString() });
  s.completedSessions++;
}

function addTest(studentName, name, got, of, date) {
  const s = findStudent(studentName);
  if (!s) return;
  s.testResults.push({ id: randomUUID(), name, scoreGot: got, scoreOf: of, createdAt: new Date(date).toISOString() });
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
addNote("Rahma", "10/13 did good overall, just needed more analysis and knowledge on the 8 marker. Doing 4.2 poverty and inequality, worksheet given", "2025-12-28");
addTest("Rahma", "Topic test", 10, 13, "2025-12-28");

// 03/01/2026
addNote("Abyan", "Went over 1.4 content. Now doing a full 1.4 Managing People mock.", "2026-01-03");
addNote("Liban", "Went over leadership content. Now doing a full 1.4 Managing People mock.", "2026-01-03");
addNote("Rahma", "Completed Contestable Markets.", "2026-01-03");
addTest("Rahma", "15-marker contestable markets", 11, 15, "2026-01-03");

// 04/01/2026
addNote("Liban", "Doing unit 1.3 mock. Came an hour late due to traffic. Poor reasoning and analysis on staffing test — needs to explain why and how.", "2026-01-04");
addTest("Liban", "1.4.1 Approaches to staffing", 2, 6, "2026-01-04");
addTest("Rahma", "4.3.1 Measures of development", 5, 5, "2026-01-04");
addTest("Rahma", "4.3.2 Factors influencing growth and development", 9, 15, "2026-01-04");
addTest("Daniel", "4.3.1 Measures of development", 4, 5, "2026-01-04");
addNote("Daniel", "4.3.2 Factors influencing growth and development — practice questions given", "2026-01-04");

// 03/15/2026
addNote("Rahma", "Did monopolies and is now doing a test. Did well, but needs to focus more on analysis and structure of evaluation.", "2026-03-15");
addTest("Rahma", "Monopoly test", 21, 28, "2026-03-15");
addTest("Liban", "Roles of entrepreneurs MCQ", 9, 10, "2026-03-15");

// 03/22/2026
addTest("Rahma", "4.1.5.10 Market Structure, Static/Dynamic Efficiency", 19, 26, "2026-03-22");
addNote("Rahma", "Some issues: wrong definition of monopsony for 4-marker. 10-marker had incomplete analysis chains, failure to explain efficiency types, lack of application. Finished 4.1.5.10.", "2026-03-22");
addNote("Abyan", "Doing practice questions on 1.5.1 Role of an entrepreneur and 1.5.2 Entrepreneurial motives. Was about 30 minutes late due to missing bus.", "2026-03-22");
addNote("Jumal", "Came about ~40 minutes late and asked to do a mock test.", "2026-03-22");
addNote("Waseela W", "Covered all of elasticities, got 12/18 on topic test. Didn't attempt 6 marker properly, 2 MCQ mistakes. Started and finished market failure, attempting open test.", "2026-03-22");
addTest("Waseela W", "Elasticities topic test", 12, 18, "2026-03-22");
addNote("Ayaan", "Covered all of elasticities, 6/16. Started market failure, now attempting open test.", "2026-03-22");
addTest("Ayaan", "Elasticities topic test", 6, 16, "2026-03-22");

// ── Build output ──

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
