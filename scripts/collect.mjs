// GitHub + Reddit에서 인기 AI/IT 글을 모아 JSON으로 저장한다.
// 사용법: npm run collect       → data/raw.json (오늘)
//         npm run collect:week  → data/weekly/<YYYY-Www>.raw.json (최근 7일)
import { mkdir, writeFile } from "node:fs/promises";

const UA = "vive-trends-mvp/0.1 (prototype)";
const SUBREDDITS = ["MachineLearning", "LocalLLaMA", "artificial", "programming"];

const PERIOD = process.argv[2] === "week" ? "week" : "day";
const CONFIG = {
  day: { githubCount: 10, redditTime: "day", redditLimit: 20 },
  week: { githubCount: 15, redditTime: "week", redditLimit: 25 },
}[PERIOD];

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

// KST 기준 ISO 주차(월~일). ISO 규칙대로 주는 목요일이 속한 달·연도에 속한다.
function isoWeek(now) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const monday = new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - ((kst.getUTCDay() + 6) % 7)),
  );
  const thursday = new Date(monday.getTime() + 3 * DAY_MS);
  const year = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Monday = jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * DAY_MS;
  const week = 1 + Math.round((monday.getTime() - week1Monday) / (7 * DAY_MS));
  return {
    key: `${year}-W${pad(week)}`,
    month: `${year}-${pad(thursday.getUTCMonth() + 1)}`,
    from: ymd(monday),
    to: ymd(new Date(monday.getTime() + 6 * DAY_MS)),
  };
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${url}`);
  return res.json();
}

async function fetchGitHub() {
  const since = new Date(Date.now() - 7 * DAY_MS).toISOString().slice(0, 10);
  const q = encodeURIComponent(`topic:ai created:>${since}`);
  const data = await getJson(
    `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${CONFIG.githubCount}`,
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
  const url = `https://www.reddit.com/r/${SUBREDDITS.join("+")}/top/.rss?t=${CONFIG.redditTime}&limit=${CONFIG.redditLimit}`;
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

// url은 화면에서 링크로 그대로 쓰이므로 https만 남긴다 (javascript:, data: 등 차단).
const isHttps = (url) => {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
};

const items = [];
const errors = [];

const jobs = [
  { source: "github", run: fetchGitHub },
  { source: "reddit", run: fetchReddit },
];

for (const job of jobs) {
  try {
    const fetched = await job.run();
    const got = fetched.filter((item) => isHttps(item.url));
    items.push(...got);
    const dropped = fetched.length - got.length;
    console.log(`✓ ${job.source}: ${got.length}개${dropped ? ` (https가 아닌 URL ${dropped}개 제외)` : ""}`);
  } catch (err) {
    errors.push({ source: job.source, message: String(err.message ?? err) });
    console.warn(`✗ ${job.source}: ${err.message ?? err}`);
  }
}

const now = new Date();
const week = PERIOD === "week" ? isoWeek(now) : undefined;
const file = week ? `data/weekly/${week.key}.raw.json` : "data/raw.json";

await mkdir(week ? "data/weekly" : "data", { recursive: true });
await writeFile(
  file,
  JSON.stringify({ collectedAt: now.toISOString(), period: PERIOD, week, items, errors }, null, 2),
);
console.log(`\n${file} 저장 완료 (항목 ${items.length}개, 실패 ${errors.length}건)`);
