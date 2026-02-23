export type Impact = "low" | "medium" | "high" | "critical";

export interface Decision {
  id: string;
  ts: string;
  topic: string;
  decision: string;
  rationale: string;
  impact: Impact;
  tags: string[];
}

export interface DecisionFileMeta {
  project: string;
  version: string;
  created: string;
  updated: string;
}

export interface DecisionFile {
  meta: DecisionFileMeta;
  decisions: Decision[];
}

export interface SearchQuery {
  keywords?: string[];
  tags?: string[];
  impact?: Impact;
  limit?: number;
}

export interface SearchResult {
  decision: Decision;
  matchedFields: Array<"topic" | "decision" | "rationale" | "tags">;
}

export interface ContextSummary {
  total: number;
  highImpactCount: number;
  lastUpdated: string;
  topTopics: string[];
  recentDecisions: Decision[];
}
