# UI Law

The authoritative design document for ScholrTutor. Every UI change must conform to the rules below.

ScholrTutor is a **desktop Electron app** with a secondary responsive fallback (≥ 375 px) for accessibility and future web distribution. Section 10 below replaces the "mobile-first" boilerplate: the baseline viewport is **desktop** (≥ 1024 px) with graceful scaling downward.

## The Meta-Rule

> **Any new pattern not already in this document must be added here *first*, then adopted in code — in the same commit.**
>
> - If the convention exists below: use it exactly as specified.
> - If it doesn't: open this file, add the row/section with a one-line rationale, and ship it alongside the code that uses it.
> - Retroactive documentation is how inconsistency creeps in. The document leads; the code follows.

---

## 1. Component reuse

### 1.1 shadcn + base-ui primitives are the source of primitives
- `Button`, `Input`, `Dialog`, `AlertDialog`, `Select`, `Tabs`, `DropdownMenu`, `Tooltip`, `Sheet`, `Card`, `Skeleton`, `Switch`, `Separator`, `Sidebar` all live in `src/components/ui/`. Installed or hand-written wrappers over `@base-ui/react/*`.
- **Never hand-roll a primitive we already have**. No native `<select>`. No hand-rolled tab bars. No AlertDialog for non-destructive dialogs — use `Dialog`.
- If a primitive is missing, add a thin wrapper under `src/components/ui/` that mirrors the shadcn API shape. Don't inline-style a raw `<button>` for more than one-off chrome.

### 1.2 Where components live
- **Route-scoped** (used by one page only): `src/app/<route>/_components/<kebab-name>.tsx`.
- **Cross-route helper** that isn't a primitive (date-nav, stat-card, log-card): `src/app/_components/<kebab-name>.tsx`.
- **App-wide reusable** (session-log-input, theme-provider, titlebar, app-sidebar): `src/components/<kebab-name>.tsx`.
- **Primitive**: `src/components/ui/<kebab-name>.tsx`.

### 1.3 File-length discipline
- No `page.tsx` over ~200 lines. If it's growing, extract the inner components to `_components/`.
- No single `.tsx` over ~400 lines unless it's a primitive wrapper around a complex base-ui component (e.g. `sidebar.tsx`).

---

## 2. Colors

Two layers, used for different jobs:

### 2.1 Semantic theme tokens (default)
Everything theme-aware uses the token system in `src/app/globals.css`: `bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-destructive`, `bg-success`, `bg-warning`, `bg-info`, `ring`, `bg-popover`, `bg-sidebar`, `bg-sidebar-accent`, etc. These swap with light/dark mode and respect the user's accent hue (see §9).

| Purpose              | Class                                |
|----------------------|--------------------------------------|
| Page background      | `bg-background`                      |
| Card / surface       | `bg-card`                            |
| Subtle surface       | `bg-muted` or `bg-muted/80`          |
| Hover surface        | `bg-accent` / `bg-accent/60`         |
| Primary action       | `bg-primary text-primary-foreground` |
| Destructive action   | `bg-destructive/10 text-destructive` |
| Border (default)     | `border-border`                      |
| Border (subtle)      | `border-border/50`                   |
| Text primary         | `text-foreground`                    |
| Text secondary       | `text-muted-foreground`              |
| Positive / good      | `text-success`                       |
| Warning              | `text-warning`                       |
| Error                | `text-destructive`                   |
| Informational accent | `text-info`                          |

### 2.2 Mention-chip tokens (domain)
Session-log mentions use a separate palette defined in `globals.css`: `--mention-student`, `--mention-topic`, `--mention-file`, `--mention-unresolved`. Always reference via the CSS variable; never hex-pick.

### 2.3 Opacity discipline
Only two border opacities: `border-border` (default) and `border-border/50` (subtle). **Do not** sprinkle `/15 /20 /30 /40` — those were the decay pattern we cleaned up. For text, prefer the semantic tokens (`text-muted-foreground`) over opacity fractions. `text-muted-foreground/60` and `text-muted-foreground/80` are forbidden — use `text-muted-foreground` directly.

### 2.4 No arbitrary hex
No `#abcdef` literals. No `rgb(…)`, no `oklch(…)` inline except in `globals.css` token definitions or the §9 accent-hue slider background.

---

## 3. Spacing

Tailwind's default numeric scale. Allowed step values: `0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20`. **No arbitrary values** like `p-[13px]`, `w-[90px]`, `ml-[8px]`. If a value doesn't exist, justify it in code review or pick the nearest step.

Responsive: base classes target tablet (~768 px+). `sm:` scales down for narrow windows; `md:` / `lg:` polish desktop.

| Context                   | Class                         |
|---------------------------|-------------------------------|
| Tight stack               | `gap-2`                       |
| Card contents / row       | `gap-3`                       |
| Between sections          | `gap-5` / `gap-6`             |
| Page-level section gap    | `gap-8`                       |
| Card padding              | `p-4`                         |
| Code-block / inline       | `p-3` / `px-1.5 py-0.5`       |
| Input padding             | `px-2.5 py-1` (h-8/h-9 input) |
| Topbar vertical padding   | `py-2.5`                      |
| Page padding              | `p-4 sm:p-8`                  |

---

## 4. Typography

Font family: inherits (`font-sans`, Geist). Weights used: `400` default, `500` medium, `600` semibold.

**The typography scale is fixed.** Only these values exist:

| Role           | Class                                                   |
|----------------|---------------------------------------------------------|
| H1 (page)      | `text-2xl font-medium tracking-tight sm:text-3xl`       |
| H2 (section)   | `text-sm font-medium text-muted-foreground`             |
| Body           | `text-sm`                                               |
| Secondary      | `text-sm text-muted-foreground`                         |
| Small / caption| `text-xs text-muted-foreground`                         |
| Micro / eyebrow| `text-[11px] font-medium uppercase tracking-wider`      |
| Mono / code    | `font-mono text-xs`                                     |

**Forbidden:** `text-[9px]`, `text-[10px]`, `text-[13px]`, `text-[15px]`, `text-[8px]`. These were artefacts of the old microscale and have been removed.

---

## 5. Layout recipes

| Recipe               | Class                                                  |
|----------------------|--------------------------------------------------------|
| Page shell           | `flex h-full flex-col p-4 sm:p-8`                      |
| Section header       | `shrink-0` + H1 + description                          |
| Scrolling content    | `flex-1 min-h-0 overflow-auto`                         |
| Card                 | `rounded-lg border border-border bg-card`              |
| Inline row           | `flex items-center gap-3`                              |
| Stacked → inline     | `flex flex-col gap-3 sm:flex-row sm:items-center`      |
| Button group         | `flex flex-wrap gap-2`                                 |
| Topbar inner         | `flex items-center gap-2 px-1.5`                       |
| List row             | see `_components/` — always rounded-lg + border-border |

---

## 6. Component structure

### 6.1 Server Components by default
`"use client"` only when using `useState`, `useEffect`, refs, browser APIs, or context hooks.

### 6.2 Props
- Explicitly typed. No `props: any`.
- Domain types live in `@/lib/*` or route-local `_components/*.ts` helpers.

### 6.3 Async action feedback — three states, always visible
Every async action shows:
- **Loading** — disable the trigger, swap the label to `Saving…` / `Generating…` + `CircleNotch` spinner.
- **Success** — reset form, render the returned data, or show a `role="status"` confirmation.
- **Error** — render a visible `role="alert"` using `text-destructive` + subtle `bg-destructive/10 border-destructive/30` container.

---

## 7. Accessibility baseline

- Every `<input>` has an associated `<label>` or `aria-label`.
- Every icon-only button has an `aria-label`.
- Toggle buttons set `aria-pressed`; radio-like groups use `role="radiogroup"` with `role="radio"` + `aria-checked`; expandable items set `aria-expanded`.
- Errors use `role="alert"`; status updates use `role="status"`.
- Don't rely on color alone — always pair with icon or text.
- Keyboard: `onClick` on a non-button element also wires `tabIndex={0}` + `onKeyDown` for `Enter`.
- Touch targets: primary CTAs use the default Button (`h-8` + padding) or `h-9` on desktop. Icon-only interactive elements default to `size-8` / `size-9` minimum.
- Don't override the keyboard behavior that base-ui primitives ship with.

---

## 8. Data layer

ScholrTutor currently persists all state in the renderer's `localStorage` (`scholrtutor-students`, `scholrtutor-subjects`, `scholrtutor-session-logs`, `scholrtutor-settings`). This is the source of truth until an Electron IPC + SQLite migration lands.

- All persistence helpers live in `src/lib/*.tsx` / `*.ts` as React context providers.
- AI calls go through OpenRouter via `fetch` — settings in `src/lib/settings.tsx`.
- JSON parse failures never silently eat data: catch and surface via `role="alert"` where possible.

---

## 9. Theming

Two axes, both in `src/app/globals.css`:

- **Palette** — `:root` defines the light theme; `.dark` overrides for dark. `next-themes` toggles the `dark` class on `<html>` and supports `system` (following `prefers-color-scheme`).
- **Accent** — `src/lib/settings.tsx::applySettings` writes `--primary` / `--sidebar-primary` / `--ring` as `oklch(0.55 0.2 <hue>)`. The hue is user-controlled (0–360) with named presets in the Appearance tab.

All theme-aware classes (§2.1) swap automatically. FOUC is controlled by next-themes' `disableTransitionOnChange`.

---

## 10. Desktop-first, responsive down

- **Baseline** — `≥ 1024 px` (typical Electron window). Unprefixed classes target this.
- **`md:` (≥ 768 px)** — small tablets. Complex multi-column layouts collapse.
- **`sm:` (≥ 640 px)** — large phone landscape / narrow split. Stacked rows become inline.
- **`< 640 px`** — mobile fallback. Pages stay legible and tappable (44×44 min for primary actions) but density is allowed to drop.

**Rule of thumb:** start desktop. Add `max-sm:` / `max-md:` overrides only when a layout actually breaks. Don't force a mobile-first cascade on an app that ships as a desktop window.

`xl:` / `2xl:` for polish, never for correctness.

---

## 11. Amending this document

When you introduce a new pattern:

1. Open this file.
2. Add a row to the matching table (§2 / §3 / §4 / §5) **or** a new subsection.
3. Include a one-line rationale.
4. Commit the doc change in the same commit as the code.
5. From that commit forward, all UI must follow the new rule.

---

## LLM checklist before submitting a UI change

- [ ] §§2–5 checked for existing conventions?
- [ ] No arbitrary values (`text-[13px]`, `w-[90px]`, `border-border/15`)?
- [ ] Opacity variants on `border-border` and `text-muted-foreground` limited to the two values in §2.3?
- [ ] Reused shadcn/base-ui primitives instead of building new ones (§1.1)?
- [ ] Route-scoped composites extracted to `_components/` (§1.2)?
- [ ] Three async states visible (§6.3)?
- [ ] Every icon-only button has an `aria-label` (§7)?
- [ ] Page verified in a real window at ≥ 1024 px and at the minimum ≥ 640 px?
