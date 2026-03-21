# ScholrTutor — Design Document
**Version:** 0.3
**Author:** Saif
**Last Updated:** 2026-03-20

---

## 1. Overview

ScholrTutor is a **locally-run desktop application** for tutors to manage students, log live session notes, track performance, and generate AI-powered summaries. It runs entirely on the tutor's machine — no cloud database, no auth, no hosting costs. AI features (OpenRouter) require an internet connection but all data stays local.

**Distribution plan:** Packaged as a desktop app (Windows + macOS). A marketing landing page will be built separately at a later date for paid distribution.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Desktop shell | Electron | Packages the app for Windows + macOS |
| Frontend | Next.js 14+ (App Router) | Runs inside Electron via `next export` / custom server |
| UI Library | shadcn/ui + Tailwind CSS | Mocked in Google Stitch |
| Database | SQLite (local file) | Single `.db` file stored in app user data directory |
| ORM | Prisma + `prisma-client-js` (SQLite adapter) | Type-safe queries; trivial to migrate to Postgres later |
| AI | OpenRouter | Requires internet; model controlled via `lib/ai-model.ts` |
| File Storage | Local filesystem | Uploaded files copied to app user data directory |
| Packaging | `electron-builder` | Produces `.exe` (Windows) and `.dmg` (macOS) installers |

### Electron + Next.js Integration Pattern

Next.js runs as a local server inside the Electron main process. The renderer loads `http://localhost:PORT`. All database access happens exclusively in the **main process** via Electron IPC — the renderer never touches Prisma or SQLite directly.

```
Renderer (Next.js UI)
      ↕ ipcRenderer.invoke()
Main Process (Electron)
      ↕ Prisma Client
SQLite (.db file)
```

### `lib/ai-model.ts`
All AI calls route through a single file. Swapping models is one line.

```ts
export const AI_MODEL = "google/gemini-2.0-flash-001";
export async function callAI(userPrompt: string, systemPrompt?: string): Promise<string>
```

---

## 3. IPC Architecture

All database and filesystem operations are performed in the Electron main process and exposed to the renderer via typed IPC handlers. This is the most important architectural pattern in the app — it must be followed consistently.

### Pattern

```ts
// main/ipc/students.ts — main process handler
ipcMain.handle('students:getAll', async () => {
  return prisma.student.findMany({ include: { subject: true } })
})

ipcMain.handle('students:create', async (_, data: CreateStudentInput) => {
  return prisma.student.create({ data })
})
```

```ts
// lib/ipc-client.ts — renderer-side typed wrapper
export const ipc = {
  students: {
    getAll: () => ipcRenderer.invoke('students:getAll'),
    create: (data: CreateStudentInput) => ipcRenderer.invoke('students:create', data),
  }
}
```

```ts
// Usage in a Next.js page or component
const students = await ipc.students.getAll()
```

### IPC Channel Naming Convention
```
{resource}:{action}
students:getAll
students:getById
students:create
students:update
students:delete
session:log
session:parse
files:upload
files:getAll
summary:generate
attendance:checkIn
grades:recalculate
```

### Preload Script
The preload script (`preload.ts`) bridges main and renderer safely via `contextBridge`:

```ts
// preload.ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args)
})
```

---

## 4. Data Storage

### Database
Prisma uses a local SQLite file stored in Electron's user data directory:

```ts
// main/db.ts
import { app } from 'electron'
import path from 'path'

const DB_PATH = path.join(app.getPath('userData'), 'scholrtutor.db')
// Passed to Prisma via DATABASE_URL env var at runtime
process.env.DATABASE_URL = `file:${DB_PATH}`
```

### Uploaded Files
Test papers and worksheets are copied to the user data directory on upload:

```
{userData}/
  scholrtutor.db
  files/
    mocktest1.pdf
    markets_mock_2026-03-20.pdf
```

### Migrations
Prisma migrations run automatically on app startup:

```ts
// In main process, before app is ready
await prisma.$executeRaw`PRAGMA journal_mode=WAL`
// Run pending migrations
execSync('npx prisma migrate deploy', { cwd: resourcesPath })
```

---

## 5. Data Model (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Subject {
  id              String    @id @default(cuid())
  name            String
  examBoard       String
  level           String    // "A-Level" | "GCSE" | "Other"
  gradeBoundaries String    // JSON string: { "A*": 90, "A": 80, ... }
  topics          Topic[]
  students        Student[]
  files           File[]
  createdAt       DateTime  @default(now())
}

model Topic {
  id          String          @id @default(cuid())
  subjectId   String
  subject     Subject         @relation(fields: [subjectId], references: [id])
  code        String          // "3", "3.1", "3.1.2"
  title       String
  parentCode  String?
  weight      Float           @default(1.0)
  notes       StudentNote[]
  progress    TopicProgress[]
}

model Student {
  id               String              @id @default(cuid())
  referenceNumber  String              @unique
  name             String
  subjectId        String
  subject          Subject             @relation(fields: [subjectId], references: [id])
  currentGrade     String?
  predictedGrade   String?             // computed
  targetGrade      String?
  isRegular        Boolean             @default(false)
  createdAt        DateTime            @default(now())
  attendance       Attendance[]
  notes            StudentNote[]
  progress         TopicProgress[]
  summaries        DailySummary[]
  rosterOverrides  SessionRosterOverride[]
  mentions         Mention[]
}

model Attendance {
  id          String    @id @default(cuid())
  studentId   String
  student     Student   @relation(fields: [studentId], references: [id])
  date        DateTime
  checkedInAt DateTime  @default(now())
  present     Boolean   @default(true)
  note        String?
}

model SessionLog {
  id        String     @id @default(cuid())
  rawText   String
  date      DateTime   @default(now())
  parsedAt  DateTime?
  createdAt DateTime   @default(now())
  mentions  Mention[]
}

model Mention {
  id              String     @id @default(cuid())
  sessionLogId    String
  sessionLog      SessionLog @relation(fields: [sessionLogId], references: [id])
  type            String     // "student" | "file" | "topic"
  targetId        String
  rawToken        String
  contextSnippet  String?
  resolved        Boolean    @default(false)
  student         Student?   @relation(fields: [targetId], references: [id])
}

model StudentNote {
  id            String     @id @default(cuid())
  studentId     String
  student       Student    @relation(fields: [studentId], references: [id])
  sessionLogId  String?
  date          DateTime   @default(now())
  noteType      String     // "general" | "test_result" | "topic_progress" | "concern"
  content       String
  testScoreGot  Int?
  testScoreOf   Int?
  topicId       String?
  topic         Topic?     @relation(fields: [topicId], references: [id])
}

model File {
  id          String    @id @default(cuid())
  slug        String    @unique
  displayName String
  localPath   String    // absolute path in userData/files/
  subjectId   String?
  subject     Subject?  @relation(fields: [subjectId], references: [id])
  uploadedAt  DateTime  @default(now())
}

model TopicProgress {
  id          String    @id @default(cuid())
  studentId   String
  student     Student   @relation(fields: [studentId], references: [id])
  topicId     String
  topic       Topic     @relation(fields: [topicId], references: [id])
  status      String    @default("not_started") // "not_started" | "introduced" | "practised" | "confident"
  confidence  Int?      // 1–5
  lastUpdated DateTime  @updatedAt

  @@unique([studentId, topicId])
}

model DailySummary {
  id             String    @id @default(cuid())
  studentId      String
  student        Student   @relation(fields: [studentId], references: [id])
  date           DateTime
  generatedText  String
  generatedAt    DateTime  @default(now())
  sessionLogIds  String    // JSON array of SessionLog IDs
}

model SessionRosterOverride {
  id        String    @id @default(cuid())
  studentId String
  student   Student   @relation(fields: [studentId], references: [id])
  date      DateTime
  action    String    // "add" | "remove"
}
```

---

## 6. @Mention System

### Token Conventions

| Token | Resolves to | Example |
|---|---|---|
| `@firstname` | Student — fuzzy name match | `@melissa` |
| `@ref` | Student — exact reference match | `@ST-001` |
| `@slug` | File — exact slug match | `@mocktest1` |
| `@x.y.z` | Topic — exact code match | `@3.1.2` |

### Topic Autocomplete — Subject Scoping

Topic codes are not globally unique. The autocomplete narrows scope using student context already resolved in the same log entry:

1. **One student mentioned** → show topics from their subject only
2. **Multiple students, different subjects** → group topics by student/subject in the dropdown
3. **No student mentioned yet** → show all topics grouped by subject

Unresolvable tokens remain as **amber unresolved mentions** — click to resolve inline.

### Parsing Pipeline

1. User submits raw text → saved immediately via `session:log` IPC (feels instant)
2. Main process parser runs:
   - Tokenises all `@word` patterns
   - Resolves: fuzzy student name → exact ref → exact file slug → exact topic code
   - Uses student context for topic scoping
   - Detects score patterns `\b(\d{1,3})\/(\d{1,3})\b` near student mentions → creates `StudentNote { noteType: "test_result" }`
   - Infers topic progress: `@topic` near `@student` → upserts `TopicProgress`
   - Saves all `Mention` records
3. UI updates with colour-coded resolved mentions and amber flags

---

## 7. File Slug Convention

Slugs are **manually set** with an auto-suggested placeholder prefilled on upload:

```
{topic}_{type}_{YYYY-MM-DD}
// e.g. markets_mock_2026-03-20
```

Always editable before saving. Slug becomes the @mention token.

---

## 8. Predicted Grade Algorithm

Recalculates automatically whenever new test scores are recorded.

```
For each topic T the student has test data on:
  topicAverage(T) = mean of all (testScoreGot / testScoreOf) percentages

predictedScore = mean of all topicAverage(T)   [equal weight, v1]

predictedGrade = lookup predictedScore against Subject.gradeBoundaries (JSON)
```

Grade boundaries are defined per subject in the spec editor. Stored on `Student.predictedGrade`, labelled "predicted (calculated)" vs manually-set current grade.

**v2 (future hosted version):** Per-topic weight field for exam-board-accurate calculation.

---

## 9. Regular Roster & Attendance

### Roster
`Student.isRegular` defines default weekly attendees. Per-session overrides live in `SessionRosterOverride` (keyed to date) — adding/removing someone for today doesn't affect permanent status.

### Attendance
Explicit check-in action on the Session page. Log entries alone do not count as attendance. Absence can also be logged (`present: false`) with an optional note.

---

## 10. Pages & Navigation

### Shell Layout
- **Custom titlebar** (36px): frameless Electron window with draggable title area and window controls (minimize, maximize, close). No default menu bar.
- **Sidebar** (shadcn `<SidebarProvider>` + `<Sidebar collapsible="icon">`): logo, nav links, today's roster chip strip. Collapses to icon-only mode with smooth CSS transition (200ms ease-linear). Toggle via `Ctrl+B` keyboard shortcut or rail click.
- **Quick-log modal**: floating session input accessible from any page (`Cmd+K`)

---

### 10.1 Dashboard `/`

| Widget | Description |
|---|---|
| Today's Students | Roster chips with check-in status |
| Active Students | Total count |
| Recent Logs | Last 3–5 session entries |
| Flagged Students | Students with open concern notes |
| Subject Distribution | Bar/pie of students per subject |
| Grade Overview | Current vs predicted, all students |

---

### 10.2 Students `/students`

Searchable, filterable roster table.

**Columns:** Name · Ref · Subject · Exam Board · Current Grade · Predicted Grade · Target Grade · Last Session

**Filters:** Subject, grade, regular/occasional

---

### 10.3 Student Profile `/students/[id]`

**Header:** Name, ref, subject, grade badges (current / predicted / target), regular toggle

**Tabs:** Overview · Topics · Test Results · Files · AI Summaries

---

### 10.4 Session Log `/session`

- Auto-expanding textarea, focused on load. `Cmd+Enter` to submit.
- Left sidebar: today's students with check-in buttons. Click chip → inserts `@name`
- Log entries below: colour-coded resolved mentions (blue = student, purple = file, green = topic, amber = unresolved)
- Toast after submission showing what was parsed

---

### 10.5 Files `/files`

- Drag-and-drop upload zone (copies file to `userData/files/`)
- Grid: display name, slug, subject tag, upload date
- Inline slug editor + "Copy @mention" button

---

### 10.6 Daily Summary `/summary`

- Date picker (defaults to today)
- One card per student logged that day: notes, test scores, topics covered, AI summary + Regenerate button
- "Generate All" button for the day

---

### 10.7 Subjects & Specs `/subjects`

- List of defined subjects
- Create/edit: name, exam board, level, grade boundaries
- Topic tree editor: hierarchical dot-notation — `1` major · `1.2` subtopic · `1.2.3` minor objective

---

## 11. File & Folder Structure

```
/
├── main/                        → Electron main process
│   ├── index.ts                 → App entry, window creation
│   ├── db.ts                    → Prisma init + DB path setup
│   ├── ipc/                     → IPC handlers (one file per resource)
│   │   ├── students.ts
│   │   ├── session.ts
│   │   ├── files.ts
│   │   ├── summary.ts
│   │   ├── attendance.ts
│   │   └── subjects.ts
│   └── parser.ts                → @mention tokeniser + resolver
│
├── renderer/                    → Next.js app (frontend)
│   ├── app/
│   │   ├── page.tsx             → Dashboard
│   │   ├── students/
│   │   │   ├── page.tsx         → Roster
│   │   │   └── [id]/page.tsx    → Student Profile
│   │   ├── session/page.tsx
│   │   ├── summary/page.tsx
│   │   ├── files/page.tsx
│   │   └── subjects/page.tsx
│   ├── components/
│   │   ├── ui/                  → shadcn primitives
│   │   ├── session/             → SessionInput, MentionChip, LogEntry, RosterSidebar
│   │   ├── students/            → StudentCard, TopicGrid, GradeBadge
│   │   ├── summary/             → SummaryCard, RegenerateButton
│   │   └── subjects/            → TopicTreeEditor, GradeBoundaryEditor
│   └── lib/
│       ├── ipc-client.ts        → Typed renderer-side IPC wrappers
│       ├── ai-model.ts          → OpenRouter config + callAI()
│       └── score-detector.ts    → Regex score extraction
│
├── preload.ts                   → contextBridge IPC exposure
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

## 12. Design Tokens

All visual values are defined as CSS custom properties in `src/app/globals.css`. Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.) reference these variables — never hardcoded values. To change the look of the entire app, edit the values below and update `globals.css` to match.

### Icon Library

**Phosphor Icons** (`@phosphor-icons/react`) — used exclusively throughout the app.

| Context | Weight | Size |
|---|---|---|
| Navigation (inactive) | `regular` | `20` |
| Navigation (active) | `fill` | `20` |
| Logo / branding | `duotone` | `20` |
| Inline / buttons | `regular` | `16` |
| Decorative / empty states | `thin` | `48` |

### Color Tokens (Light Mode)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(1 0 0)` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | Default text |
| `--card` | `oklch(1 0 0)` | Card backgrounds |
| `--card-foreground` | `oklch(0.145 0 0)` | Card text |
| `--popover` | `oklch(1 0 0)` | Popover/dropdown backgrounds |
| `--popover-foreground` | `oklch(0.145 0 0)` | Popover text |
| `--primary` | `oklch(0.205 0 0)` | Primary buttons, active nav items |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on primary |
| `--secondary` | `oklch(0.97 0 0)` | Secondary buttons |
| `--secondary-foreground` | `oklch(0.205 0 0)` | Text on secondary |
| `--muted` | `oklch(0.97 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.556 0 0)` | Inactive nav text, placeholders |
| `--accent` | `oklch(0.97 0 0)` | Hover backgrounds |
| `--accent-foreground` | `oklch(0.205 0 0)` | Hover text |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Delete/danger actions |
| `--border` | `oklch(0.922 0 0)` | Borders, dividers |
| `--input` | `oklch(0.922 0 0)` | Input borders |
| `--ring` | `oklch(0.708 0 0)` | Focus rings |

### Color Tokens (Dark Mode)

| Token | Value |
|---|---|
| `--background` | `oklch(0.145 0 0)` |
| `--foreground` | `oklch(0.985 0 0)` |
| `--card` | `oklch(0.205 0 0)` |
| `--card-foreground` | `oklch(0.985 0 0)` |
| `--popover` | `oklch(0.205 0 0)` |
| `--popover-foreground` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.922 0 0)` |
| `--primary-foreground` | `oklch(0.205 0 0)` |
| `--secondary` | `oklch(0.269 0 0)` |
| `--secondary-foreground` | `oklch(0.985 0 0)` |
| `--muted` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.708 0 0)` |
| `--accent` | `oklch(0.269 0 0)` |
| `--accent-foreground` | `oklch(0.985 0 0)` |
| `--destructive` | `oklch(0.704 0.191 22.216)` |
| `--border` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(1 0 0 / 15%)` |
| `--ring` | `oklch(0.556 0 0)` |

### Sidebar Tokens

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-primary` | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |

### Layout Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius` | `0.625rem` | Base border radius (sm/md/lg/xl derived from this) |
| `--sidebar-width` | `16rem` | Full sidebar width |
| `--sidebar-width-icon` | `3rem` | Icon-only collapsed sidebar width |
| Titlebar height | `36px` (`h-9`) | Custom Electron titlebar |
| Window controls | `44px` wide each | Minimize, maximize, close buttons |

### Typography

| Context | Font | Weight | Size |
|---|---|---|---|
| Body / UI | Geist Sans (`--font-sans`) | `400` | `14px` (text-sm) |
| Code / mono | Geist Mono (`--font-mono`) | `400` | `14px` |
| Headings | Geist Sans (`--font-heading`) | `600` | varies |
| Sidebar nav | Geist Sans | `500` | `14px` (text-sm) |
| Sidebar logo | Geist Sans | `600` | `16px` (text-base) |

### Mention Chip Colors

| Mention type | Color |
|---|---|
| Student | Blue |
| File | Purple |
| Topic | Green |
| Unresolved | Amber |

---

## 13. Future / v2 Scope (Hosted SaaS)

When the hosted version is built, the migration path is intentionally minimal:

| Change | Effort |
|---|---|
| Prisma: SQLite → Postgres | Change one line in `schema.prisma` + update `DATABASE_URL` |
| Add `tutorId` to all tables | Single Prisma migration; all queries gain a `where: { tutorId }` scope |
| Add auth (Clerk or Firebase) | New middleware layer; IPC layer becomes API routes |
| Replace local file storage | Swap `localPath` for a Blob URL; same `File` model |
| OpenRouter calls | Already internet-facing; no change needed |

The Electron codebase is designed so the renderer (Next.js) is largely portable to a web deployment — the main coupling point is `ipc-client.ts`, which would be replaced with standard `fetch` API calls.

---

## 13. Open Questions

1. **Auto-update:** Should the app check for updates on launch (via `electron-updater`) from day one, or defer to v2?
2. **Backup:** Should the app offer a manual "Export backup" button that zips the `.db` file and `files/` folder?
3. **OpenRouter API key:** Stored in Electron's `safeStorage` (encrypted on disk) and entered once via a settings page — confirm this is the expected UX.