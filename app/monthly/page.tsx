import type { Metadata } from "next";
import {
  ArchiveNav,
  ArrowLink,
  Brief,
  Cmd,
  Notice,
  PageShell,
  SectionTitle,
  fmt,
  monthLabel,
  weekRange,
} from "@/components/ui";
import { loadMonthly } from "@/lib/data";

export const metadata: Metadata = { title: "월간 트렌드 · AI/IT Trend Radar" };

async function Monthly({ searchParams }: { searchParams: PageProps<"/monthly">["searchParams"] }) {
  const { m } = await searchParams;
  const result = await loadMonthly(typeof m === "string" ? m : undefined);

  if (result.kind === "empty") {
    return (
      <Notice>
        아직 월간 정리가 없습니다. Claude Code에서 <Cmd>/refresh-weekly</Cmd>를 실행하면 그 주가 속한 달의 정리가 함께
        만들어집니다.
      </Notice>
    );
  }

  const { data, keys, current } = result;
  // 달의 흐름을 시간 순서대로 읽도록 주차는 오래된 순
  const weeks = [...data.weeks].sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div>
      <ArchiveNav
        label="지난 달"
        items={keys.map((k) => ({ href: `/monthly?m=${k}`, label: monthLabel(k), current: k === current }))}
      />
      <div className="flex flex-col gap-16">
        <Brief
          eyebrow={`Monthly · ${current}`}
          title={`${monthLabel(current)} AI/IT 흐름`}
          overview={data.overview}
          meta={[
            { label: "포함", value: `주간 정리 ${weeks.length}개` },
            { label: "생성", value: fmt(data.generatedAt) },
          ]}
          highlights={data.highlights}
        />

        {data.themes.length > 0 && (
          <section aria-labelledby="themes-title">
            <SectionTitle id="themes-title">이달의 흐름</SectionTitle>
            <ul className="grid gap-3 md:grid-cols-2">
              {data.themes.map((t) => (
                <li
                  key={t.title}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</h3>
                  <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">{t.description}</p>
                  {t.weeks.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="등장한 주">
                      {t.weeks.map((w) => (
                        <li
                          key={w}
                          className="rounded-md border border-zinc-200 px-2 py-0.5 font-mono text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
                        >
                          {w}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="timeline-title">
          <SectionTitle id="timeline-title">주차별 타임라인</SectionTitle>
          <ol className="flex flex-col gap-8 border-l border-zinc-200 pl-6 dark:border-zinc-800">
            {weeks.map((w) => (
              <li key={w.key} className="relative flex flex-col gap-2">
                <span
                  aria-hidden
                  className="absolute top-1 -left-[30px] size-3 rounded-full border-2 border-background bg-lime-500"
                />
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{w.key}</span> ·{" "}
                  {weekRange(w.from, w.to)}
                </p>
                <p className="max-w-[68ch] text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">{w.headline}</p>
                <ArrowLink href={`/weekly?w=${w.key}`}>주간 정리 보기</ArrowLink>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

export default function MonthlyPage(props: PageProps<"/monthly">) {
  return (
    <PageShell active="month">
      <Monthly searchParams={props.searchParams} />
    </PageShell>
  );
}
