# ScholrTutor — Design Document
**Version:** 0.4
**Author:** Saif
**Last Updated:** 2026-03-21

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

The app uses an **inset panel** layout pattern. The sidebar's dark background acts as a shell that frames the content panel — a lighter, elevated surface with rounded corners and a subtle gap on all sides.

- **Custom titlebar** (36px / `h-9`): frameless Electron window. Left side: sidebar toggle (`SidebarSimple` icon) + `>` breadcrumb separator + page title. Center: draggable zone. Right side: minimize, maximize, close buttons. Background matches sidebar color.
- **Sidebar** (shadcn `<SidebarProvider>` + `<Sidebar collapsible="offcanvas">`): S-curve brand logo, search bar, nav links. Collapses via offcanvas slide (200ms ease-linear). Toggle via `Ctrl+B` keyboard shortcut or titlebar button.
- **Content panel**: `rounded-xl` corners, `m-2` gap from sidebar edges, `shadow-md`, `bg-background`. The sidebar's darker color shows through in the gaps, creating depth.
- **Sidebar footer tray**: recessed `rounded-lg` strip at bottom with `bg-sidebar-accent/50`, contains gear (settings) + theme toggle icons at equal weight. Mirrors the inset panel pattern at miniature scale.
- **Settings page** (`/settings`): AI config (OpenRouter key, model selection), appearance (theme, accent color, font size), data paths, about info.
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

### 10.8 Settings `/settings`

Card-based layout with sections:

| Section | Contents |
|---|---|
| AI Configuration | OpenRouter API key (masked input with show/hide toggle), AI model selector (radio-card UI: Gemini 2.0 Flash, Claude Sonnet 4, GPT-4o Mini) |
| Appearance | Theme switcher (Light / Dark / System), accent color picker (7 preset swatches + continuous hue slider 0-360°), font size (Small / Default / Large) |
| Data & Storage | Database path, file storage path (read-only display) |
| About | App version, Electron version, Next.js version |

Settings are persisted to `localStorage` via `SettingsProvider` context. Accent color overrides `--primary`, `--sidebar-primary`, and `--ring` CSS vars at runtime. Font size sets `html { font-size }` to 14/16/18px.

---

## 11. File & Folder Structure

```
/
├── electron/                    → Electron main process
│   ├── main.js                  → App entry, window creation, IPC handlers
│   └── preload.js               → contextBridge IPC exposure
│
├── src/                         → Next.js app (frontend)
│   ├── app/
│   │   ├── layout.tsx           → Root layout (fonts, providers, shell)
│   │   ├── globals.css          → Design tokens + base styles
│   │   ├── page.tsx             → Dashboard
│   │   ├── students/page.tsx    → Student roster
│   │   ├── session/page.tsx     → Session log
│   │   ├── files/page.tsx       → File manager
│   │   ├── summary/page.tsx     → Daily summaries
│   │   ├── subjects/page.tsx    → Subject/spec editor
│   │   └── settings/page.tsx    → Settings (AI, appearance, data)
│   ├── components/
│   │   ├── ui/                  → shadcn primitives (button, card, input, etc.)
│   │   ├── app-sidebar.tsx      → Main sidebar with nav + footer tray
│   │   ├── app-logo.tsx         → S-curve brand icon (inline SVG)
│   │   ├── titlebar.tsx         → Custom Electron titlebar with breadcrumbs
│   │   ├── theme-toggle.tsx     → Dark/light toggle button
│   │   └── theme-provider.tsx   → next-themes wrapper
│   └── lib/
│       ├── settings.tsx         → Settings context + localStorage persistence
│       └── utils.ts             → cn() + shared utilities
│
├── build/                       → App icons (icon.svg, icon.png, icon.ico)
│
└── prisma/
    ├── schema.prisma
    └── migrations/
```

---

## 12. Design Tokens

All visual values are defined as CSS custom properties in `src/app/globals.css`. Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.) reference these variables — never hardcoded values. The palette uses warm-tinted neutrals (slight chroma on hue 75 for light, hue 265 for dark) to avoid the flat/sterile feel of pure achromatic grays.

### Icon Library

**Phosphor Icons** (`@phosphor-icons/react`) — used exclusively. Always use **direct imports** for tree-shaking:

```ts
// GOOD
import { Users } from "@phosphor-icons/react/dist/ssr/Users";
// BAD — bundles entire library
import { Users } from "@phosphor-icons/react";
```

| Context | Weight | Size |
|---|---|---|
| Navigation (inactive) | `regular` | `18` |
| Navigation (active) | `fill` | `18` |
| Sidebar footer / utility | `regular` | `17` |
| Titlebar | `regular` | `16` |
| Inline / buttons | `regular` | `16` |
| Decorative / empty states | `thin` | `48` |

### Color Tokens (Light Mode — warm neutrals)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.995 0.002 75)` | Content panel background |
| `--foreground` | `oklch(0.16 0.006 285)` | Default text |
| `--card` | `oklch(1 0 0)` | Card backgrounds |
| `--card-foreground` | `oklch(0.16 0.006 285)` | Card text |
| `--popover` | `oklch(1 0 0)` | Popover/dropdown backgrounds |
| `--popover-foreground` | `oklch(0.16 0.006 285)` | Popover text |
| `--primary` | `oklch(0.22 0.008 285)` | Primary buttons, active states (overridden by accent hue at runtime) |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on primary |
| `--secondary` | `oklch(0.965 0.003 75)` | Secondary buttons |
| `--secondary-foreground` | `oklch(0.22 0.008 285)` | Text on secondary |
| `--muted` | `oklch(0.965 0.003 75)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.52 0.01 265)` | Inactive nav, placeholders |
| `--accent` | `oklch(0.955 0.004 75)` | Hover backgrounds |
| `--accent-foreground` | `oklch(0.22 0.008 285)` | Hover text |
| `--destructive` | `oklch(0.58 0.22 25)` | Danger actions |
| `--destructive-foreground` | `oklch(0.985 0 0)` | Text on danger |
| `--success` | `oklch(0.62 0.17 150)` | Success states |
| `--warning` | `oklch(0.78 0.16 80)` | Warning states |
| `--info` | `oklch(0.60 0.16 255)` | Info states |
| `--border` | `oklch(0.915 0.004 75)` | Borders, dividers |
| `--input` | `oklch(0.915 0.004 75)` | Input borders |
| `--ring` | `oklch(0.65 0.01 265)` | Focus rings (overridden by accent hue) |

### Color Tokens (Dark Mode — deep blue-gray)

| Token | Value |
|---|---|
| `--background` | `oklch(0.185 0.008 265)` |
| `--foreground` | `oklch(0.96 0.004 75)` |
| `--card` | `oklch(0.185 0.009 265)` |
| `--popover` | `oklch(0.195 0.009 265)` |
| `--primary` | `oklch(0.93 0.004 75)` |
| `--primary-foreground` | `oklch(0.16 0.008 265)` |
| `--secondary` | `oklch(0.24 0.01 265)` |
| `--muted` | `oklch(0.24 0.01 265)` |
| `--muted-foreground` | `oklch(0.65 0.012 265)` |
| `--accent` | `oklch(0.24 0.01 265)` |
| `--destructive` | `oklch(0.68 0.19 22)` |
| `--border` | `oklch(1 0 0 / 9%)` |
| `--input` | `oklch(1 0 0 / 12%)` |
| `--ring` | `oklch(0.52 0.012 265)` |

### Sidebar Tokens

The sidebar is darker than the content panel in both themes, creating the "shell frames panel" depth effect.

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | `oklch(0.98 0.003 75)` | `oklch(0.115 0.009 265)` |
| `--sidebar-foreground` | `oklch(0.16 0.006 285)` | `oklch(0.96 0.004 75)` |
| `--sidebar-primary` | `oklch(0.22 0.008 285)` | `oklch(0.56 0.22 265)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.945 0.004 75)` | `oklch(0.18 0.009 265)` |
| `--sidebar-accent-foreground` | `oklch(0.16 0.006 285)` | `oklch(0.96 0.004 75)` |
| `--sidebar-border` | `oklch(0.915 0.004 75)` | `oklch(1 0 0 / 7%)` |

### Layout Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius` | `0.625rem` | Base border radius (sm/md/lg/xl derived) |
| `--sidebar-width` | `16rem` | Full sidebar width |
| `--sidebar-width-icon` | `3rem` | Icon-only collapsed width |
| `--titlebar-height` | `2.25rem` | Custom Electron titlebar (36px) |
| `--header-height` | `3.5rem` | Content header bar |
| `--page-padding` | `2rem` | Default page content padding |
| Content panel radius | `rounded-xl` | 12px corners on inset panel |
| Content panel gap | `m-2` | 8px gap between sidebar and panel |
| Window controls | `44px` wide each | Minimize, maximize, close |

### Typography

**Geist** (Vercel's font, `geist` package) for all text. Single font family — weight differentiation only.

| Context | Font | Weight | Size | Class |
|---|---|---|---|---|
| Page headings | Geist Sans (`--font-heading`) | `500` | `30px` | `font-heading text-3xl font-medium tracking-tight` |
| Section headings | Geist Sans (`--font-heading`) | `500` | `24px` | `font-heading text-2xl font-medium tracking-tight` |
| Body / UI | Geist Sans (`--font-sans`) | `400` | `14px` | `text-sm` |
| Subtitles | Geist Sans (`--font-sans`) | `400` | `14px` | `text-sm text-muted-foreground` |
| Code / mono | Geist Mono (`--font-mono`) | `400` | `14px` | `font-mono text-sm` |
| Sidebar nav | Geist Sans | `500` | `13px` | `text-[13px] font-medium` |
| Sidebar logo | Geist Sans | `600` | `14px` | `text-[14px] font-semibold` |

### Mention Chip Colors

| Mention type | Light | Dark |
|---|---|---|
| Student | `oklch(0.62 0.15 250)` | `oklch(0.68 0.14 250)` |
| File | `oklch(0.58 0.18 300)` | `oklch(0.68 0.18 300)` |
| Topic | `oklch(0.62 0.18 155)` | `oklch(0.68 0.18 155)` |
| Unresolved | `oklch(0.72 0.14 80)` | `oklch(0.78 0.14 80)` |

### Shadows (warm-tinted light, deep dark)

| Token | Light | Dark |
|---|---|---|
| `--shadow-xs` | `0 1px 2px oklch(0.16 0.006 285 / 4%)` | `0 1px 2px oklch(0 0 0 / 12%)` |
| `--shadow-sm` | two-layer, 6%/4% | two-layer, 24%/18% |
| `--shadow-md` | two-layer, 7%/5% | two-layer, 28%/22% |
| `--shadow-lg` | two-layer, 8%/5% | two-layer, 32%/24% |

### Motion

| Token | Value |
|---|---|
| `--transition-fast` | `100ms` |
| `--transition-normal` | `180ms` |
| `--transition-slow` | `280ms` |

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