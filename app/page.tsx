import TrendList from "@/components/TrendList";
import { Brief, Cmd, Notice, PageShell, fmt } from "@/components/ui";
import { loadTrends } from "@/lib/data";

async function Trends() {
  const result = await loadTrends();

  if (result.kind === "empty") {
    return (
      <Notice>
        아직 데이터가 없습니다. Claude Code에서 <Cmd>/refresh-trends</Cmd>를 실행하세요.
      </Notice>
    );
  }

  if (result.kind === "raw") {
    const { data } = result;
    return (
      <div className="flex flex-col gap-10">
        <Notice>
          수집만 된 상태입니다 ({fmt(data.collectedAt)} 수집). AI 요약을 보려면 Claude Code에서{" "}
          <Cmd>/refresh-trends</Cmd>를 실행하세요.
        </Notice>
        <TrendList items={data.items} />
      </div>
    );
  }

  const { data } = result;
  return (
    <div className="flex flex-col gap-14">
      <Brief
        eyebrow="Today's Brief"
        title="오늘의 AI/IT 트렌드"
        overview={data.overview}
        meta={[
          { label: "수집", value: fmt(data.collectedAt) },
          { label: "요약", value: fmt(data.generatedAt) },
        ]}
        highlights={data.highlights}
      />
      <TrendList items={data.items} />
    </div>
  );
}

export default function Home() {
  return (
    <PageShell active="day">
      <Trends />
    </PageShell>
  );
}
