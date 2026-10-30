export type Source = "github" | "reddit";
export type Period = "day" | "week";

export interface TrendItem {
  id: string;
  source: Source;
  title: string;
  url: string;
  description: string;
  metrics: { stars?: number; score?: number; comments?: number };
  meta: Record<string, string | null>;
  // summarizer 서브에이전트가 추가하는 필드
  summary?: string;
  tags?: string[];
}

// ISO 주차(월~일, KST). 주는 목요일이 속한 달(month)에 속한다.
export interface WeekInfo {
  key: string; // "2026-W44"
  month: string; // "2026-10"
  from: string; // "2026-10-26"
  to: string; // "2026-11-01"
}

// period/week는 주간 수집에만 있다 (없으면 일간)
export interface RawData {
  collectedAt: string;
  period?: Period;
  week?: WeekInfo;
  items: TrendItem[];
  errors: { source: string; message: string }[];
}

export interface SummaryData {
  generatedAt: string;
  collectedAt: string;
  period?: Period;
  week?: WeekInfo;
  overview: string;
  highlights: string[];
  items: TrendItem[];
}

// monthly-digest 서브에이전트가 그 달의 주간 요약들을 묶어 만든다
export interface MonthlyData {
  generatedAt: string;
  month: string; // "2026-10"
  weeks: (Omit<WeekInfo, "month"> & { headline: string })[];
  overview: string;
  themes: { title: string; description: string; weeks: string[] }[];
  highlights: string[];
}
