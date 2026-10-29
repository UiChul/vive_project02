"use client";

import { useState } from "react";
import type { Source, TrendItem } from "@/lib/types";

const TABS: { key: "all" | Source; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "github", label: "GitHub" },
  { key: "reddit", label: "Reddit" },
];

export default function TrendList({ items }: { items: TrendItem[] }) {
  const [tab, setTab] = useState<"all" | Source>("all");
  const shown = tab === "all" ? items : items.filter((i) => i.source === tab);

  return (
    <section>
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {t.label} ({t.key === "all" ? items.length : items.filter((i) => i.source === t.key).length})
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-semibold uppercase">
                {item.source === "github" ? "GitHub" : `r/${item.meta.subreddit}`}
              </span>
              {item.source === "github" && item.meta.language && <span>· {item.meta.language}</span>}
              <span className="ml-auto">
                {item.metrics.stars !== undefined && `⭐ ${item.metrics.stars.toLocaleString()}`}
                {item.source === "reddit" && item.meta.rank && `🔥 오늘 #${item.meta.rank}`}
              </span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold leading-snug hover:underline"
            >
              {item.title}
            </a>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {item.summary ?? (item.description || "설명 없음")}
            </p>
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
