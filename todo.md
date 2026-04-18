# Todo

## Fixed in v3.0.0
- [x] previous/future log timestamps — session log now uses `datetime-local`
- [x] click subject from student profile — links to `/subjects?id=<id>`
- [x] minimal tables on home page
- [x] unified `@` autocomplete (students + topics together)
- [x] starred students saved via export (inside `scholrtutor-students`)
- [x] sidebar subject links deep-link to `/subjects?id=<id>`
- [x] sidebar starred students deep-link to `/students?id=<id>` (and re-fires on param change)
- [x] tables redesigned, no nested scroll
- [x] delete-with-text button on note/test rows
- [x] per-subject topic matching in AI parse (system prompt enforces)
- [x] Files page removed (was a stub)
- [x] Version display reads from `package.json`
- [x] Real AI model list (no nonexistent previews)
- [x] `Dialog` primitive replaces `AlertDialog` misuse
- [x] Native `<select>` replaced with shadcn `Select`
- [x] Hand-rolled settings tabs replaced with shadcn `Tabs`
- [x] Provider pyramid flattened into `<AppProviders>`
- [x] Every page < 200 lines; composites in `_components/`
- [x] `error.tsx` + `loading.tsx`
- [x] Icon-only buttons now have `aria-label`
- [x] System theme preview actually works

## Still open
- [ ] Edit existing `@mention` chips in place (change `@student(X)` → `@student(Y)` without re-typing)
- [ ] Bulk edit / reassign session log entries
- [ ] Email test papers and worksheets to student directly (needs file-attachment work)
- [ ] SQLite + IPC migration (lift 5 MB localStorage ceiling)
