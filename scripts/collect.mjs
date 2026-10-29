// GitHub + Reddit에서 인기 AI/IT 글을 모아 data/raw.json으로 저장한다.
// 사용법: npm run collect
import { mkdir, writeFile } from "node:fs/promises";

const UA = "vive-trends-mvp/0.1 (prototype)";
const SUBREDDITS = ["MachineLearning", "LocalLLaMA", "artificial", "programming"];

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${url}`);
  return res.json();
}

async function fetchGitHub() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const q = encodeURIComponent(`topic:ai created:>${since}`);
  const data = await getJson(
    `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`,
    { Accept: "application/vnd.github+json" },
  );
  return data.items.map((r) => ({
    id: `gh-${r.id}`,
    source: "github",
    title: r.full_name,
    url: r.html_url,
    description: r.description ?? "",
    metrics: { stars: r.stargazers_count },
    meta: { language: r.language, topics: (r.topics ?? []).slice(0, 5).join(", ") },
  }));
}

// Reddit JSON API는 비인증 요청을 403으로 막아서, 공개 RSS(Atom) 피드를 쓴다.
// RSS에는 점수/댓글 수가 없으므로 순서(=오늘의 top 순위)만 신뢰한다.
const decode = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/&amp;/g, "&");
const pick = (xml, re) => xml.match(re)?.[1] ?? "";

async function fetchReddit() {
  const url = `https://www.reddit.com/r/${SUBREDDITS.join("+")}/top/.rss?t=day&limit=20`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${url}`);
  const xml = await res.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e], rank) => {
    const body = decode(pick(e, /<content[^>]*>([\s\S]*?)<\/content>/));
    const text = decode(body.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    return {
      id: `rd-${pick(e, /<id>([^<]+)<\/id>/)}`,
      source: "reddit",
      title: decode(pick(e, /<title>([\s\S]*?)<\/title>/)),
      url: pick(e, /<link href="([^"]+)"/),
      description: text.replace(/submitted by .*$/, "").slice(0, 500),
      metrics: {},
      meta: {
        subreddit: pick(e, /<category term="([^"]+)"/),
        rank: String(rank + 1),
        published: pick(e, /<published>([^<]+)<\/published>/),
      },
    };
  });
}

const items = [];
const errors = [];

const jobs = [
  { source: "github", run: fetchGitHub },
  { source: "reddit", run: fetchReddit },
];

for (const job of jobs) {
  try {
    const got = await job.run();
    items.push(...got);
    console.log(`✓ ${job.source}: ${got.length}개`);
  } catch (err) {
    errors.push({ source: job.source, message: String(err.message ?? err) });
    console.warn(`✗ ${job.source}: ${err.message ?? err}`);
  }
}

await mkdir("data", { recursive: true });
await writeFile(
  "data/raw.json",
  JSON.stringify({ collectedAt: new Date().toISOString(), items, errors }, null, 2),
);
console.log(`\ndata/raw.json 저장 완료 (항목 ${items.length}개, 실패 ${errors.length}건)`);
