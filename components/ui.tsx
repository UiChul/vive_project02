import Link from "next/link";
import { Suspense } from "react";

// 서버 컴포넌트에서 공유하는 화면 조각들 (헤더, 브리프, 안내, 아카이브 탐색)

export const fmt = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

// "2026-10-26", "2026-11-01" → "10.26 – 11.01"
export const weekRange = (from: string, to: string) =>
  `${from.slice(5).replace("-", ".")} – ${to.slice(5).replace("-", ".")}`;

// "2026-10" → "2026년 10월"
export const monthLabel = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;

export type View = "day" | "week" | "month";

const NAV: { key: View; href: string; label: string }[] = [
  { key: "day", href: "/", label: "오늘" },
  { key: "week", href: "/weekly", label: "주간" },
  { key: "month", href: "/monthly", label: "월간" },
];

function SiteHeader({ active }: { active: View }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-background/80 backdrop-blur-md dark:border-zinc-800/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-5">
        <Link href="/" className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-500">
          <span aria-hidden className="relative flex size-2.5">
            <span className="absolute inline-flex size-full rounded-full bg-lime-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-lime-500" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-tight">
            trend<span className="text-zinc-400">/</span>radar
          </span>
        </Link>
        <nav aria-label="기간" className="ml-auto">
          <ul className="flex gap-1">
            {NAV.map((n) => (
              <li key={n.key}>
                <Link
                  href={n.href}
                  aria-current={n.key === active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${
                    n.key === active
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="flex animate-pulse flex-col gap-4">
      <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-9 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

// 헤더 + 도트 배경 + 본문. 본문은 요청 시점 데이터를 읽으므로 Suspense로 감싼다.
export function PageShell({ active, children }: { active: View; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader active={active} />
      <div className="relative">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-80" />
        <main className="relative mx-auto w-full max-w-5xl px-5 pt-12 pb-24 sm:pt-16">
          <Suspense fallback={<Skeleton />}>{children}</Suspense>
        </main>
      </div>
    </>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
      <p>{children}</p>
    </div>
  );
}

export function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-amber-900/10 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-amber-200/10">
      {children}
    </code>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-xs font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
      <span aria-hidden className="h-px w-6 bg-lime-500" />
      {children}
    </p>
  );
}

export function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 text-lg font-bold tracking-tight">
      {children}
    </h2>
  );
}

// 지난 주/달로 이동하는 칩 목록
export function ArchiveNav({ label, items }: { label: string; items: { href: string; label: string; current: boolean }[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className="-mx-5 mb-10 overflow-x-auto px-5">
      <ul className="flex gap-2">
        {items.map((it) => (
          <li key={it.href} className="shrink-0">
            <Link
              href={it.href}
              aria-current={it.current ? "page" : undefined}
              className={`block rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${
                it.current
                  ? "border-lime-500 bg-lime-50 text-zinc-900 dark:bg-lime-500/10 dark:text-zinc-50"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
              }`}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// 상단 요약 영역: 라벨, 제목, 전체 흐름, 메타 정보, 하이라이트 카드
export function Brief({
  eyebrow,
  title,
  overview,
  meta,
  highlights,
  footer,
}: {
  eyebrow: string;
  title: string;
  overview: string;
  meta: { label: string; value: string }[];
  highlights: string[];
  footer?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="brief-title" className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 id="brief-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-[68ch] text-[17px] leading-8 text-zinc-700 dark:text-zinc-300">{overview}</p>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {meta.map((m) => (
            <div key={m.label} className="flex gap-1.5">
              <dt>{m.label}</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{m.value}</dd>
            </div>
          ))}
        </dl>
        {footer}
      </div>

      <ol className="grid gap-3 md:grid-cols-3">
        {highlights.map((h, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <span className="font-mono text-sm font-semibold text-lime-600 dark:text-lime-400">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">{h}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex w-fit items-center gap-1 rounded text-sm font-medium text-lime-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 dark:text-lime-400"
    >
      {children}
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
