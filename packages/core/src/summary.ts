import type { ContextSummary, Decision, DecisionFile, Impact } from "./types.js";
import { serializeDecisionRow } from "./parser.js";

const HIGH_IMPACT: Impact[] = ["high", "critical"];

/**
 * Dosyadaki en sık geçen topic'leri döndürür.
 */
function topTopics(decisions: Decision[], n = 5): string[] {
  const counts = new Map<string, number>();
  for (const d of decisions) {
    counts.set(d.topic, (counts.get(d.topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([topic]) => topic);
}

/**
 * Oturum başında inject edilecek özet bilgisini üretir.
 * Max ~200 token hedeflenir.
 */
export function buildContextSummary(
  file: DecisionFile,
  options: { includeRecent?: boolean } = {}
): ContextSummary {
  const { includeRecent = true } = options;
  const { decisions } = file;

  const highImpactCount = decisions.filter((d) =>
    HIGH_IMPACT.includes(d.impact)
  ).length;

  const lastUpdated =
    decisions.length > 0
      ? decisions[decisions.length - 1].ts.slice(0, 10)
      : file.meta.updated;

  const recentDecisions = includeRecent
    ? decisions
        .filter((d) => HIGH_IMPACT.includes(d.impact))
        .slice(-5)
        .reverse()
    : [];

  return {
    total: decisions.length,
    highImpactCount,
    lastUpdated,
    topTopics: topTopics(decisions),
    recentDecisions,
  };
}

/**
 * Dosyaya yazılacak summary bloğunu üretir.
 */
export function buildSummaryBlock(file: DecisionFile): string {
  const summary = buildContextSummary(file, { includeRecent: false });
  const topics = summary.topTopics.join("|");
  return `summary{total,high_impact,last_updated,top_topics}:\n${summary.total},${summary.highImpactCount},${summary.lastUpdated},${topics}`;
}

/**
 * TOON formatında özet çıktısı üretir (MCP tool yanıtı için).
 */
export function formatContextSummaryAsToon(
  file: DecisionFile,
  includeRecent = true
): string {
  const summary = buildContextSummary(file, { includeRecent });
  const topics = summary.topTopics.join("|");

  let output = `summary{total,high_impact,last_updated,top_topics}:\n`;
  output += `${summary.total},${summary.highImpactCount},${summary.lastUpdated},${topics}`;

  if (includeRecent && summary.recentDecisions.length > 0) {
    output += `\n\nrecent_high_impact[${summary.recentDecisions.length}]{id,ts,topic,decision,impact}:\n`;
    for (const d of summary.recentDecisions) {
      const decisionField = d.decision.includes(",")
        ? `"${d.decision}"`
        : d.decision;
      output += `${d.id},${d.ts},${d.topic},${decisionField},${d.impact}\n`;
    }
  }

  return output.trimEnd();
}
