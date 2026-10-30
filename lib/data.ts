import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import type { MonthlyData, RawData, SummaryData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8")) as T;
  } catch {
    return null;
  }
}

// data/<dir> 안에서 패턴에 맞는 파일의 키를 최신순으로 (예: "2026-W44")
async function listKeys(dir: string, pattern: RegExp) {
  const files = await readdir(path.join(DATA_DIR, dir)).catch(() => [] as string[]);
  const keys = new Set(files.map((f) => f.match(pattern)?.[1]).filter((k): k is string => !!k));
  return [...keys].sort().reverse();
}

// summary.json(요약본)이 있으면 그걸, 없으면 raw.json(요약 전)을 돌려준다.
export async function loadTrends() {
  await connection(); // 빌드 시점이 아니라 요청 시점에 파일을 읽도록
  const summary = await readJson<SummaryData>("summary.json");
  if (summary) return { kind: "summary" as const, data: summary };
  const raw = await readJson<RawData>("raw.json");
  if (raw) return { kind: "raw" as const, data: raw };
  return { kind: "empty" as const };
}

// 주간: data/weekly/<key>.json(요약) → <key>.raw.json(요약 전) 순서로. key가 없거나 모르는 값이면 최신 주.
export async function loadWeekly(key?: string) {
  await connection();
  const keys = await listKeys("weekly", /^(\d{4}-W\d{2})(?:\.raw)?\.json$/);
  const current = key && keys.includes(key) ? key : keys[0];
  if (current) {
    const summary = await readJson<SummaryData>(`weekly/${current}.json`);
    if (summary) return { kind: "summary" as const, keys, current, data: summary };
    const raw = await readJson<RawData>(`weekly/${current}.raw.json`);
    if (raw) return { kind: "raw" as const, keys, current, data: raw };
  }
  return { kind: "empty" as const, keys };
}

export const listMonths = () => listKeys("monthly", /^(\d{4}-\d{2})\.json$/);

// 월간: data/monthly/<YYYY-MM>.json. key가 없거나 모르는 값이면 최신 달.
export async function loadMonthly(key?: string) {
  await connection();
  const keys = await listMonths();
  const current = key && keys.includes(key) ? key : keys[0];
  const data = current ? await readJson<MonthlyData>(`monthly/${current}.json`) : null;
  if (current && data) return { kind: "monthly" as const, keys, current, data };
  return { kind: "empty" as const, keys };
}
