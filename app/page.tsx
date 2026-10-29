import { Suspense } from "react";
import TrendList from "@/components/TrendList";
import { loadTrends } from "@/lib/data";

const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      {children}
    </div>
  );
}

async function Trends() {
  const result = await loadTrends();

  if (result.kind === "empty") {
    return (
      <Notice>
        아직 데이터가 없습니다. Claude Code에서 <code>/refresh-trends</code>를 실행하세요.
      </Notice>
    );
  }

  if (result.kind === "raw") {
    const { data } = result;
    return (
      <div className="flex flex-col gap-6">
        <Notice>
          수집만 된 상태입니다 (수집: {fmt(data.collectedAt)}). AI 요약을 보려면 Claude Code에서{" "}
          <code>/refresh-trends</code>를 실행하세요.
        </Notice>
        <TrendList items={data.items} />
      </div>
    );
  }

  const { data } = result;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-zinc-500">
        수집 {fmt(data.collectedAt)} · 요약 {fmt(data.generatedAt)}
      </p>
      <section className="rounded-xl bg-zinc-900 p-5 text-zinc-100 dark:bg-zinc-800">
        <h2 className="mb-2 text-lg font-bold">오늘의 AI/IT 트렌드</h2>
        <p className="mb-4 text-sm leading-relaxed text-zinc-300">{data.overview}</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {data.highlights.map((h, i) => (
            <li key={i}>
              <span className="mr-2 font-bold text-indigo-300">{i + 1}</span>
              {h}
            </li>
          ))}
        </ul>
      </section>
      <TrendList items={data.items} />
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">AI/IT Trend Radar</h1>
        <p className="text-sm text-zinc-500">GitHub · Reddit에서 지금 뜨는 AI/IT 소식 요약</p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">불러오는 중…</p>}>
        <Trends />
      </Suspense>
    </main>
  );
}
