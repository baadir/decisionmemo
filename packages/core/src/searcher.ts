import type { Decision, DecisionFile, Impact, SearchQuery, SearchResult } from "./types.js";

const IMPACT_WEIGHT: Record<Impact, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function computeMatchedFields(
  d: Decision,
  keywords: string[],
  tags: string[]
): SearchResult["matchedFields"] {
  const matched: SearchResult["matchedFields"] = [];
  const kws = keywords.map((k) => k.toLowerCase());

  if (tags.length > 0 && tags.some((t) => d.tags.map((dt) => dt.toLowerCase()).includes(t))) {
    matched.push("tags");
  }
  if (kws.some((k) => d.topic.toLowerCase().includes(k))) matched.push("topic");
  if (kws.some((k) => d.decision.toLowerCase().includes(k))) matched.push("decision");
  if (kws.some((k) => d.rationale.toLowerCase().includes(k))) matched.push("rationale");

  return matched;
}

/**
 * Karar dosyasında keyword ve/veya tag bazlı arama yapar.
 * Sonuçlar impact ağırlığına göre sıralanır (critical önce).
 */
export function searchDecisions(file: DecisionFile, query: SearchQuery): SearchResult[] {
  const keywords = (query.keywords ?? []).map((k) => k.toLowerCase());
  const tags = (query.tags ?? []).map((t) => t.toLowerCase());
  const impactFilter = query.impact;
  const limit = query.limit ?? 5;

  // Hiç filtre yoksa son N kararı döndür
  if (keywords.length === 0 && tags.length === 0 && !impactFilter) {
    return file.decisions
      .slice(-limit)
      .reverse()
      .map((d) => ({ decision: d, matchedFields: [] }));
  }

  const results: SearchResult[] = [];

  for (const d of file.decisions) {
    if (impactFilter && d.impact !== impactFilter) continue;

    const decisionLower = d.decision.toLowerCase();
    const rationaleLower = d.rationale.toLowerCase();
    const topicLower = d.topic.toLowerCase();
    const tagsLower = d.tags.map((t) => t.toLowerCase());

    const matchesTag =
      tags.length === 0 || tags.some((t) => tagsLower.includes(t));

    const matchesKeyword =
      keywords.length === 0 ||
      keywords.some(
        (k) =>
          topicLower.includes(k) ||
          decisionLower.includes(k) ||
          rationaleLower.includes(k) ||
          tagsLower.some((t) => t.includes(k))
      );

    if (matchesTag && matchesKeyword) {
      results.push({
        decision: d,
        matchedFields: computeMatchedFields(d, keywords, tags),
      });
    }
  }

  // Impact ağırlığına göre sırala, eşit ise en yeni önce
  results.sort((a, b) => {
    const weightDiff =
      IMPACT_WEIGHT[b.decision.impact] - IMPACT_WEIGHT[a.decision.impact];
    if (weightDiff !== 0) return weightDiff;
    return b.decision.ts.localeCompare(a.decision.ts);
  });

  return results.slice(0, limit);
}
