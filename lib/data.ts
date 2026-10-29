import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import type { RawData, SummaryData } from "./types";

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "data", file), "utf8")) as T;
  } catch {
    return null;
  }
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
