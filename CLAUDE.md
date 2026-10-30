# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

AI/IT Trend Radar — a deliberately minimal prototype/MVP that collects popular AI/IT posts from GitHub and Reddit, summarizes them in Korean, and shows them in three views: today (`/`), weekly (`/weekly`), and monthly (`/monthly`, a rollup of that month's weekly summaries). Keep changes simple: no database, no Anthropic SDK/API key in the app.

## Commands

```bash
npm run dev       # dev server at http://localhost:3000
npm run build     # production build (also the type check that matters)
npm run lint      # eslint
npx tsc --noEmit  # type check only
npm run collect       # fetch GitHub + Reddit (today) → data/raw.json
npm run collect:week  # fetch last 7 days → data/weekly/<YYYY-Www>.raw.json
```

No test framework is set up. New routes need `npm run build` (or `next dev`) once to generate `PageProps<"/route">` types before `tsc --noEmit` passes.

In Claude Code, `/refresh-trends` runs the daily pipeline (collect → summarize → verify); `/refresh-weekly` runs the weekly pipeline and then regenerates that week's month (collect:week → summarizer → verify → monthly-digest → verify). Run weekly at the end of a week (Sunday); re-running in the same week overwrites it.

## Architecture: file-based pipeline

Full details (diagram, directory map, schema, rendering model, UI system, trade-offs, change checklist) live in `architecture.md` — keep it in sync when the architecture changes.

@architecture.md

```
day    collect.mjs      ──► data/raw.json             ──► summarizer     ──► data/summary.json      ──► /
week   collect.mjs week ──► data/weekly/<wk>.raw.json ──► summarizer     ──► data/weekly/<wk>.json  ──► /weekly
month                       weekly summaries of month ──► monthly-digest ──► data/monthly/<mo>.json ──► /monthly
```

- **Periods**: weekly files are keyed by the ISO week (Mon–Sun, KST) of the collection date and carry `period: "week"` + `week: { key, month, from, to }`. A week belongs to the month of its Thursday (ISO rule), so each week rolls up into exactly one month. Monthly does no collection — it only re-reads the weekly summaries whose `week.month` matches.

- **Collect** (`scripts/collect.mjs`, plain Node, no deps): GitHub Search API (`topic:ai`, created in last 7 days, by stars) and Reddit. Each source fails independently and is recorded in `errors[]`.
  - Reddit's JSON API returns 403 to unauthenticated requests, so Reddit is read from the **Atom RSS feed** (`/r/A+B+C/top/.rss?t=day`), parsed with regex. RSS has no score/comment counts — only order, stored as `meta.rank`. Reddit rate-limits (429) quickly; keep it to one combined request.
- **Summarize** is done by Claude Code, not by the app: `.claude/agents/summarizer.md` (tools: Read, Write) handles both daily and weekly — the caller passes input/output paths (default `raw.json` → `summary.json`). It keeps every raw item (same order/ids/fields), copies `period`/`week`, and adds only `summary` + `tags`, plus top-level `overview` and `highlights`. `.claude/agents/monthly-digest.md` (Read, Write) turns a month's weekly summaries into `data/monthly/<YYYY-MM>.json` (`weeks[]` with headlines, `themes[]`, `overview`, `highlights`).
- **Display**: `lib/data.ts` has `loadTrends()` (summary → raw → empty), `loadWeekly(key?)` (weekly summary → weekly raw → empty), and `loadMonthly(key?)`; weekly/monthly also return `keys` (newest first) for archive navigation, and an unknown key falls back to the latest. `components/ui.tsx` holds shared server components (`PageShell` with the sticky header + period tabs + `<Suspense>`, `Brief`, `Notice`, `ArchiveNav`, `ArrowLink`). `components/TrendList.tsx` is the only client component (sticky source filter + feed rows, each row one link).
- `lib/types.ts` is the shared schema (`TrendItem`, `WeekInfo`, `RawData`, `SummaryData`, `MonthlyData`) for all stages — if you change the JSON shape, update the types, `collect.mjs`, and the output schema in `summarizer.md` / `monthly-digest.md` together.

## Next.js 16 specifics

- `cacheComponents` is enabled in `next.config.ts`. Don't use `export const dynamic = "force-dynamic"`; to read files at request time, the loaders call `await connection()` and pages render the reading component inside `PageShell`'s `<Suspense>`. Pass `searchParams` down as a promise and await it inside the suspended component (not in the page) to keep the static shell. Follow the same pattern for any new request-time data.
- Check `node_modules/next/dist/docs/` before using Next APIs (see AGENTS.md).

## Conventions

- UI text and summaries are Korean; product/repo names stay in their original form.
- Tailwind v4 classes inline; light and dark variants via `dark:`.
- UI style: zinc neutrals with a single lime accent; source shown by dot color (GitHub zinc, Reddit orange); Geist Mono for meta/numbers. Fonts are Geist + Noto Sans KR (Hangul fallback) via `next/font` — don't set `font-family` directly in CSS.
- Korean readability: `globals.css` sets `word-break: keep-all` and `overflow-wrap: anywhere`; body text 15–17px with relaxed leading, line length capped (~68–72ch).
- Accessibility: `aria-pressed` on filter buttons, `focus-visible` outlines, `sr-only` new-tab hint, animations behind `motion-safe:`.
