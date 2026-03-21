# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev              # Next.js dev server (http://localhost:3000)
yarn build            # Static export to out/
yarn lint             # ESLint
yarn electron:dev     # Next.js + Electron together (dev mode)
yarn electron:build   # Build static export + package with electron-builder
yarn electron:start   # Launch Electron against existing build
```

Use **yarn** (not npm) for all package operations.

## Auto-commit convention

After every change, Claude must:
1. Bump the version in `package.json` using semver (x.y.z):
   - **patch (z):** bug fixes, small tweaks, refactors
   - **minor (y):** new features, new components, new pages
   - **major (x):** breaking changes, large rewrites
2. Stage all changed files and commit with a conventional commit message that includes the new version:
   ```
   type(scope): description (vX.Y.Z)
   ```
   Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`, `build`

## Design document is the source of truth

**`design.md` governs all UI decisions.** Before making any UI change:

1. **Read `design.md` first** — check the relevant section (pages, layout, design tokens, icon conventions).
2. **Follow what's documented** — use the specified colors, spacing, typography, icon weights, and component patterns.
3. **If something isn't in the doc, add it** — any new UI decision (new component style, new color usage, new layout pattern) must be documented in `design.md` before or alongside the code change.
4. **Never contradict the doc** — if the doc says "Phosphor Icons, weight regular, size 20 for nav", don't use a different icon library, weight, or size.

### Design tokens flow

```
design.md (section 12)  →  globals.css (CSS custom properties)  →  Tailwind utilities
```

- All colors, radii, and spacing are CSS custom properties in `src/app/globals.css`
- Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`) reference these variables
- To change the app's visual style: update the token values in `design.md`, then update the matching CSS variables in `globals.css`
- **Never use hardcoded color values** — always use token-based Tailwind classes

### Icons

- **Phosphor Icons** (`@phosphor-icons/react`) exclusively — no other icon library
- Refer to design.md section 12 "Icon Library" for weight and size conventions

## Architecture

This is a **Next.js 15 + Electron** desktop app with **shadcn/ui** components.

### Two runtimes
- **Renderer (Next.js):** All UI lives in `src/` using the App Router. Pages are statically exported (`output: "export"` in `next.config.ts`) so Electron can load them from `out/`.
- **Main process (Electron):** `electron/main.js` creates the BrowserWindow. In dev it loads `localhost:3000`; in production it loads the static `out/index.html`. `electron/preload.js` exposes a safe `window.electron` bridge via `contextBridge`.

### Key constraints
- `next/image` must use `unoptimized: true` (no server for optimization in Electron).
- No API routes or server-side features — everything must work as a static export.
- Electron IPC should go through the preload script (`contextBridge`), never enable `nodeIntegration`.

### UI layer
- shadcn/ui components go in `src/components/ui/` (added via `npx shadcn add <component>`).
- Shared utilities in `src/lib/utils.ts` (includes `cn()` for Tailwind class merging).
- Tailwind CSS v4 with PostCSS; global styles in `src/app/globals.css`.
- Import alias: `@/*` maps to `src/*`.
