# CLAUDE.md

**Read [`OPERATING_GUIDE.md`](./OPERATING_GUIDE.md) first.** It is canonical: if this file,
the code, comments, or chat history conflict with it, the guide wins (§0.1). If the guide is
wrong, propose an edit to the guide — do not silently diverge.

Before writing anything, read the guide sections relevant to your task, then look at the
existing code and match its patterns (§13.1).

## Commands

```bash
pnpm dev                          # dev server + the /dev/components workbench
pnpm build                        # production build (fails on Zod schema violations)
pnpm check                        # astro check + types
pnpm test                         # Playwright e2e + axe (always builds first)
pnpm format                       # prettier
node scripts/check-contrast.mjs   # WCAG AA on every declared token pair
node scripts/check-links.mjs      # internal link check (needs dist/)
```

## Things that will bite you

- **Component `<style>` blocks cannot use Tailwind's `--spacing(n)`** — Tailwind compiles
  each block in isolation without theme context. Use `var(--space-n)` from `tokens.css`.
- **`/dev/*` is deleted from every build** by an integration in `astro.config.mjs`. It is
  reachable only through `pnpm dev`.
- **Playwright never reuses a running preview server.** A stale server produces a passing
  suite against old output; that trade is not worth the seconds it saves.
- Content config lives at `src/content.config.ts`, not `src/content/config.ts` — Astro 7
  removed the legacy location (see DECISIONS.md).

## Adding a project

One MDX file in `src/content/projects/` plus its assets. No page code changes. The schema in
`src/content.config.ts` fails the build on violations, including two honesty rules:
a `planned` project must carry a `plannedNote`, and every one of its stats must set
`scope: true`.

## Non-negotiable

§13.5 lists what needs the owner's explicit approval (section names and slugs, published
URLs, the narrative line, the stack, verified stats, résumé and bio facts, budgets,
third-party scripts). §13.6 lists what is prohibited outright — starting with fabricating
statistics. A number that cannot be traced to a committed output does not ship.
