import type { Metadata } from "next";
import TrendList from "@/components/TrendList";
import { ArchiveNav, ArrowLink, Brief, Cmd, Notice, PageShell, fmt, monthLabel, weekRange } from "@/components/ui";
import { listMonths, loadWeekly } from "@/lib/data";

export const metadata: Metadata = { title: "주간 트렌드 · AI/IT Trend Radar" };

async function Weekly({ searchParams }: { searchParams: PageProps<"/weekly">["searchParams"] }) {
  const { w } = await searchParams;
  const result = await loadWeekly(typeof w === "string" ? w : undefined);

  if (result.kind === "empty") {
    return (
      <Notice>
        아직 주간 정리가 없습니다. Claude Code에서 <Cmd>/refresh-weekly</Cmd>를 실행하세요. 최근 7일간의 인기 글을
        모아 이번 주 정리와 이번 달 정리를 함께 만듭니다.
      </Notice>
    );
  }

  const { keys, current } = result;
  const archive = (
    <ArchiveNav
      label="지난 주"
      items={keys.map((k) => ({ href: `/weekly?w=${k}`, label: k, current: k === current }))}
    />
  );

  if (result.kind === "raw") {
    return (
      <div className="flex flex-col gap-10">
        {archive}
        <Notice>
          {current} 주는 수집만 된 상태입니다 ({fmt(result.data.collectedAt)} 수집). AI 요약을 보려면 Claude Code에서{" "}
          <Cmd>/refresh-weekly</Cmd>를 실행하세요.
        </Notice>
        <TrendList items={result.data.items} />
      </div>
    );
  }

  const { data } = result;
  const { week } = data;
  const months = await listMonths();
  return (
    <div>
      {archive}
      <div className="flex flex-col gap-14">
        <Brief
          eyebrow={`Weekly · ${current}`}
          title={week ? `${weekRange(week.from, week.to)} 주간 트렌드` : "주간 트렌드"}
          overview={data.overview}
          meta={[
            { label: "수집", value: fmt(data.collectedAt) },
            { label: "요약", value: fmt(data.generatedAt) },
          ]}
          highlights={data.highlights}
          footer={
            week &&
            months.includes(week.month) && (
              <ArrowLink href={`/monthly?m=${week.month}`}>{monthLabel(week.month)} 전체 흐름 보기</ArrowLink>
            )
          }
        />
        <TrendList items={data.items} />
      </div>
    </div>
  );
}

export default function WeeklyPage(props: PageProps<"/weekly">) {
  return (
    <PageShell active="week">
      <Weekly searchParams={props.searchParams} />
    </PageShell>
  );
}
