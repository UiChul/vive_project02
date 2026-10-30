"use client";

import { useState } from "react";
import type { Source, TrendItem } from "@/lib/types";

const TABS: { key: "all" | Source; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "github", label: "GitHub" },
  { key: "reddit", label: "Reddit" },
];

const SOURCE_DOT: Record<Source, string> = {
  github: "bg-zinc-900 dark:bg-zinc-100",
  reddit: "bg-orange-500",
};

// 요약 단계에서 url이 바뀌었을 경우까지 대비해 https 링크만 건다.
const safeHref = (url: string) => (/^https:\/\//i.test(url) ? url : undefined);

function Metric({ item }: { item: TrendItem }) {
  if (item.metrics.stars !== undefined) {
    return (
      <span className="flex items-center gap-1" aria-label={`스타 ${item.metrics.stars.toLocaleString()}개`}>
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 fill-current">
          <path d="M8 .9l2.2 4.5 4.9.7-3.5 3.5.8 4.9L8 12.2l-4.4 2.3.8-4.9L.9 6.1l4.9-.7z" />
        </svg>
        {item.metrics.stars.toLocaleString()}
      </span>
    );
  }
  if (item.source === "reddit" && item.meta.rank) {
    return <span aria-label={`오늘 ${item.meta.rank}위`}>#{item.meta.rank.padStart(2, "0")}</span>;
  }
  return null;
}

export default function TrendList({ items }: { items: TrendItem[] }) {
  const [tab, setTab] = useState<"all" | Source>("all");
  const shown = tab === "all" ? items : items.filter((i) => i.source === tab);
  const count = (key: "all" | Source) => (key === "all" ? items.length : items.filter((i) => i.source === key).length);

  return (
    <section aria-labelledby="feed-title">
      <div className="sticky top-14 z-10 -mx-5 mb-2 flex flex-wrap items-center justify-between gap-3 bg-background/80 px-5 py-3 backdrop-blur-md">
        <h2 id="feed-title" className="text-lg font-bold tracking-tight">
          피드 <span className="ml-1 font-mono text-sm font-normal text-zinc-400">{shown.length}</span>
        </h2>
        <div
          role="group"
          aria-label="출처 필터"
          className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-500 ${
                tab === t.key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {t.label}
              <span className="ml-1.5 font-mono text-xs opacity-60">{count(t.key)}</span>
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {shown.map((item) => (
          <li key={item.id}>
            <a
              href={safeHref(item.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 px-3 py-5 transition-colors hover:bg-zinc-100/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-500 sm:px-4 dark:hover:bg-zinc-900/70"
            >
              <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                <span aria-hidden className={`size-1.5 rounded-full ${SOURCE_DOT[item.source]}`} />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {item.source === "github" ? "GitHub" : `r/${item.meta.subreddit}`}
                </span>
                {item.source === "github" && item.meta.language && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{item.meta.language}</span>
                  </>
                )}
                <span className="ml-auto tabular-nums">
                  <Metric item={item} />
                </span>
              </div>

              <h3 className="flex items-start gap-1.5 text-base leading-snug font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="decoration-lime-500 decoration-2 underline-offset-4 group-hover:underline">
                  {item.title}
                </span>
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="mt-0.5 size-4 shrink-0 fill-none stroke-current stroke-[1.5] text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lime-600 dark:group-hover:text-lime-400"
                >
                  <path d="M5 11L11 5M6 5h5v5" />
                </svg>
                <span className="sr-only">(새 탭에서 열림)</span>
              </h3>

              <p className="max-w-[72ch] text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
                {item.summary ?? (item.description || "설명 없음")}
              </p>

              {item.tags && item.tags.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="태그">
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                    >
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
