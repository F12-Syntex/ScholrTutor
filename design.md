# ScholrTutor — Design Document

**Version:** 1.0 (rewrite)
**Author:** Saif
**Last Updated:** 2026-04-18

---

## 1. Overview

ScholrTutor is a **locally-run desktop application** for tutors to manage students, log live session notes, track performance, and generate AI-powered summaries. It runs entirely on the tutor's machine — no cloud database, no auth, no hosting costs. AI features (OpenRouter) require an internet connection.

**Distribution plan:** Packaged as an Electron desktop app (Windows + macOS). A marketing landing page will be built separately.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Desktop shell | Electron 41 | `electron/main.js` + `electron/preload.js` |
| Frontend | Next.js 15 (App Router) | `output: "export"` → static `out/` loaded by Electron |
| UI Library | shadcn-style primitives over `@base-ui/react` + Tailwind v4 | Theme tokens in `globals.css` |
| State + persistence | React context + `localStorage` | `scholrtutor-*` keys |
| AI | OpenRouter | Single `fetch` shape; model selected in Settings |
| Packaging | `electron-builder` | `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux) |

### 2.1 Why localStorage, not SQLite?

The app was prototyped on `localStorage`. A SQLite + IPC migration is on the roadmap, but the current release is entirely renderer-side. This is documented here so future contributors don't assume a main-process data layer exists.

**When we migrate:** every `lib/*Provider` becomes a thin wrapper around `window.electron.db.*` IPC calls. The provider shape stays; the implementation swaps. Components don't change.

---

## 3. Electron + Next.js Integration

Next.js is statically exported. Electron's main process (`electron/main.js`) creates a frameless `BrowserWindow`, loads `localhost:3000` in dev or `out/index.html` in production. The preload script (`electron/preload.js`) exposes `window.electron.window.{minimize,maximize,close}` via `contextBridge` — the only IPC surface today.

Hard constraints:
- `next/image` uses `unoptimized: true` (no server).
- No server routes. No `getServerSideProps`.
- `contextIsolation: true`, `nodeIntegration: false`. Always.

---

## 4. Architecture

```
src/
  app/                       Next.js App Router
    _components/             Cross-route composites (DateNav, StatCard, LogCard, RichLogText)
    <route>/
      page.tsx               Thin route entry; delegates to _components
      _components/           Route-scoped composites
    layout.tsx               RootLayout — providers via <AppProviders>
    error.tsx                Route error boundary
    loading.tsx              Route loading state
    globals.css              Theme tokens (light/dark), scrollbar, mention chips
  components/
    app-providers.tsx        Composed provider tree
    app-sidebar.tsx          Primary navigation
    app-logo.tsx
    titlebar.tsx             Frameless-window chrome
    session-log-input.tsx    ContentEditable + autocomplete + AI parse
    theme-provider.tsx       next-themes wrapper
    ui/                      Primitives (dialog, select, tabs, button, card, …)
  lib/
    students.tsx             StudentsProvider + hook
    subjects.tsx             SubjectsProvider + hook
    settings.tsx             SettingsProvider + hook (writes CSS vars for theme/accent)
    session-log.ts           Parsing + AI call + slot resolver
    breadcrumb.tsx           Titlebar subtitle broadcast
    app-info.ts              APP_VERSION (reads package.json)
    utils.ts                 cn()
  hooks/
    use-mobile.ts            Window-width breakpoint
  types/
    electron.d.ts            window.electron typing
```

### 4.1 Provider composition

`<AppProviders>` in `src/components/app-providers.tsx` wraps Theme → Settings → Subjects → Students → Breadcrumb → Tooltip → Sidebar. One place to add providers; `layout.tsx` stays minimal.

### 4.2 Data contracts

- `Student` — see `lib/students.tsx`. Owns notes + test results. `isStarred` surfaces in the sidebar.
- `Subject` — see `lib/subjects.tsx`. Owns a flat `topics: Topic[]` list; hierarchy is carried by `Topic.parentCode`.
- `SessionLogEntry` — see `lib/session-log.ts`. Optionally carries `parsedData` (AI-inferred). `sessionSlot` is derived from `createdAt` via `resolveSessionSlot`.

### 4.3 AI integration

All AI calls go to OpenRouter. Three call sites:
- `components/session-log-input.tsx` → `parseSessionLog` (extract students/notes/tests/topics)
- `app/subjects/_components/parse.ts::parseWithAi` (extract spec structure from uploaded file)
- `app/summary/_components/generate.ts::generateSummary` (daily report)

Each enforces the "return ONLY JSON" pattern and extracts via `/\{[\s\S]*\}/`. When the model wraps JSON with prose, the regex still finds the object.

---

## 5. UI rules

See **`ui-law.md`** for every visual and structural rule. Section numbering:
- §1 component reuse + directory layout
- §2 colours (semantic tokens, mention palette, no arbitrary hex)
- §3 spacing scale
- §4 typography scale
- §5 layout recipes
- §6 component structure + async feedback
- §7 accessibility
- §8 data layer (localStorage today, IPC tomorrow)
- §9 theming (palette + accent hue)
- §10 desktop-first with responsive fallback
- §11 amending the document

`design.md` covers architecture; `ui-law.md` is the source of truth for UI.

---

## 6. Icons

- **Phosphor** (`@phosphor-icons/react`) exclusively.
- **Always use direct imports** for tree-shaking:
  ```ts
  import { Users } from "@phosphor-icons/react/dist/ssr/Users";
  ```
- For the `Icon` type: `import type { Icon } from "@phosphor-icons/react/dist/lib/types"`.
- Default size: `size={14}` for inline icons, `size={16}–18` for navigation and actions, `size={44}` for empty states.
- Default weight: `regular`. Active nav items use `fill`.

---

## 7. Auto-commit convention

After every change, Claude must:
1. Bump `package.json` using semver:
   - **patch (z):** bug fixes, tweaks, refactors
   - **minor (y):** new features, new components
   - **major (x):** breaking changes, large rewrites
2. Commit with a conventional message:
   ```
   type(scope): description (vX.Y.Z)
   ```
   Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `build`.

---

## 8. Known gaps / roadmap

- **SQLite migration.** Current `localStorage` has a ~5 MB ceiling and silently truncates session logs > 200 entries. Migration tracked in the roadmap; providers are already shaped for a drop-in IPC backend.
- **Files page.** Removed in v3. Comes back once file-attachment storage (mainline IPC) lands.
- **Timeline editing.** Session-log timestamps now support arbitrary `datetime-local`, but bulk edits still require a backup/restore cycle.
- **`@mention` editing.** Chips can be inserted and deleted but not edited in place.
