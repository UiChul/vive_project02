export type Source = "github" | "reddit";

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

export interface RawData {
  collectedAt: string;
  items: TrendItem[];
  errors: { source: string; message: string }[];
}

export interface SummaryData {
  generatedAt: string;
  collectedAt: string;
  overview: string;
  highlights: string[];
  items: TrendItem[];
}
