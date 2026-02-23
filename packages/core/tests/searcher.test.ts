import { describe, it, expect } from "vitest";
import { searchDecisions } from "../src/searcher.js";
import type { DecisionFile } from "../src/types.js";

const sampleFile: DecisionFile = {
  meta: {
    project: "test",
    version: "1",
    created: "2026-01-01",
    updated: "2026-02-23",
  },
  decisions: [
    {
      id: "D001",
      ts: "2026-01-01T10:00Z",
      topic: "auth",
      decision: "Use JWT RS256",
      rationale: "Private key stays in one service",
      impact: "high",
      tags: ["auth", "security", "jwt"],
    },
    {
      id: "D002",
      ts: "2026-01-02T10:00Z",
      topic: "database",
      decision: "Use Postgres",
      rationale: "Need concurrent writes",
      impact: "critical",
      tags: ["database", "postgres"],
    },
    {
      id: "D003",
      ts: "2026-01-03T10:00Z",
      topic: "testing",
      decision: "Use Vitest",
      rationale: "ESM-native project",
      impact: "low",
      tags: ["testing", "tooling"],
    },
  ],
};

describe("searchDecisions", () => {
  it("keyword ile arama yapar", () => {
    const results = searchDecisions(sampleFile, { keywords: ["jwt"] });
    expect(results).toHaveLength(1);
    expect(results[0].decision.id).toBe("D001");
  });

  it("tag ile arama yapar", () => {
    const results = searchDecisions(sampleFile, { tags: ["database"] });
    expect(results).toHaveLength(1);
    expect(results[0].decision.id).toBe("D002");
  });

  it("impact filtresi çalışır", () => {
    const results = searchDecisions(sampleFile, { impact: "low" });
    expect(results).toHaveLength(1);
    expect(results[0].decision.id).toBe("D003");
  });

  it("hiç filtre yoksa son N kararı döndürür", () => {
    const results = searchDecisions(sampleFile, { limit: 2 });
    expect(results).toHaveLength(2);
  });

  it("sonuçları impact ağırlığına göre sıralar (critical önce)", () => {
    const results = searchDecisions(sampleFile, { keywords: ["use"] });
    expect(results[0].decision.impact).toBe("critical");
  });

  it("rationale içinde keyword arar", () => {
    const results = searchDecisions(sampleFile, { keywords: ["concurrent"] });
    expect(results[0].decision.id).toBe("D002");
  });

  it("eşleşme olmadığında boş dizi döner", () => {
    const results = searchDecisions(sampleFile, { keywords: ["kubernetes"] });
    expect(results).toHaveLength(0);
  });

  it("limit parametresine uyar", () => {
    const results = searchDecisions(sampleFile, { keywords: ["use"], limit: 1 });
    expect(results).toHaveLength(1);
  });
});
