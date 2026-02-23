import { describe, it, expect } from "vitest";
import { splitCsvRow, parseDecisionFile, serializeDecisionRow } from "../src/parser.js";
import type { Decision } from "../src/types.js";

// ─── splitCsvRow edge case testleri ─────────────────────────────────────────

describe("splitCsvRow", () => {
  it("basit alanları doğru ayırır", () => {
    expect(splitCsvRow("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("tırnaklı alan içindeki virgülü korur", () => {
    expect(splitCsvRow(`D001,ts,"Use JWT, not sessions",rationale`)).toEqual([
      "D001",
      "ts",
      "Use JWT, not sessions",
      "rationale",
    ]);
  });

  it("escaped tırnakları çözer", () => {
    expect(splitCsvRow(`"He said \\"hello\\""`)).toEqual(['He said "hello"']);
  });

  it("boş alan döndürür", () => {
    expect(splitCsvRow("a,,c")).toEqual(["a", "", "c"]);
  });

  it("birden fazla tırnaklı alan", () => {
    expect(splitCsvRow(`"foo,bar","baz,qux"`)).toEqual(["foo,bar", "baz,qux"]);
  });

  it("alan sonunda virgül yok", () => {
    expect(splitCsvRow("x")).toEqual(["x"]);
  });

  it("escaped newline'ı çözer", () => {
    expect(splitCsvRow(`"line1\\nline2"`)).toEqual(["line1\nline2"]);
  });

  it("tırnaksız normal karar satırı", () => {
    const row = "D001,2026-01-01T10:00Z,auth,Use JWT,Stateless,high,auth|jwt";
    expect(splitCsvRow(row)).toEqual([
      "D001",
      "2026-01-01T10:00Z",
      "auth",
      "Use JWT",
      "Stateless",
      "high",
      "auth|jwt",
    ]);
  });

  it("karar ve rationale ikisi de tırnaklı", () => {
    const row = `D003,2026-01-03T12:00Z,api,"REST, not GraphQL","GraphQL adds complexity, not needed yet",medium,api|rest`;
    const parts = splitCsvRow(row);
    expect(parts[3]).toBe("REST, not GraphQL");
    expect(parts[4]).toBe("GraphQL adds complexity, not needed yet");
  });

  it("escaped backslash", () => {
    expect(splitCsvRow(`"path\\\\file"`)).toEqual(["path\\file"]);
  });

  it("başlangıçta ve sonda boş alanlar", () => {
    expect(splitCsvRow(",middle,")).toEqual(["", "middle", ""]);
  });
});

// ─── parseDecisionFile testleri ──────────────────────────────────────────────

describe("parseDecisionFile", () => {
  const sampleFile = `# decision-memory v1
project: my-app
version: 1
created: 2026-01-01
updated: 2026-02-23

decisions[2]{id,ts,topic,decision,rationale,impact,tags}:
D001,2026-02-10T14:32Z,auth,"Use JWT RS256","Keeps private key in one place",high,auth|security|jwt
D002,2026-02-11T09:15Z,database,"Use Postgres","Need concurrent writes",high,database|postgres

summary{total,high_impact,last_updated,top_topics}:
2,2,2026-02-23,auth|database
`;

  it("meta alanları doğru ayrıştırır", () => {
    const file = parseDecisionFile(sampleFile);
    expect(file.meta.project).toBe("my-app");
    expect(file.meta.created).toBe("2026-01-01");
    expect(file.meta.updated).toBe("2026-02-23");
  });

  it("karar sayısını doğru sayar", () => {
    const file = parseDecisionFile(sampleFile);
    expect(file.decisions).toHaveLength(2);
  });

  it("ilk kararı doğru ayrıştırır", () => {
    const file = parseDecisionFile(sampleFile);
    const d = file.decisions[0];
    expect(d.id).toBe("D001");
    expect(d.topic).toBe("auth");
    expect(d.decision).toBe("Use JWT RS256");
    expect(d.impact).toBe("high");
    expect(d.tags).toEqual(["auth", "security", "jwt"]);
  });

  it("boş dosyayı hatasız ayrıştırır", () => {
    const file = parseDecisionFile("");
    expect(file.decisions).toHaveLength(0);
  });

  it("summary bloğunu veri olarak almaz", () => {
    const file = parseDecisionFile(sampleFile);
    // summary satırları Decision olarak parse edilmemeli
    expect(file.decisions.every((d) => d.id.startsWith("D"))).toBe(true);
  });

  it("geçersiz impact değerini 'medium' olarak normalize eder", () => {
    const content = `decisions[1]{id,ts,topic,decision,rationale,impact,tags}:\nD001,2026-01-01T00:00Z,test,Test,Test,invalid,test`;
    const file = parseDecisionFile(content);
    expect(file.decisions[0].impact).toBe("medium");
  });
});

// ─── serializeDecisionRow testleri ──────────────────────────────────────────

describe("serializeDecisionRow", () => {
  const base: Decision = {
    id: "D001",
    ts: "2026-02-10T14:32Z",
    topic: "auth",
    decision: "Use JWT",
    rationale: "Stateless",
    impact: "high",
    tags: ["auth", "jwt"],
  };

  it("virgülsüz alanları tırnaksız yazar", () => {
    const row = serializeDecisionRow(base);
    expect(row).toBe("D001,2026-02-10T14:32Z,auth,Use JWT,Stateless,high,auth|jwt");
  });

  it("virgüllü decision'ı tırnakla sarar", () => {
    const d = { ...base, decision: "Use JWT, not sessions" };
    const row = serializeDecisionRow(d);
    expect(row).toContain('"Use JWT, not sessions"');
  });

  it("round-trip: serialize → parse → aynı veri", () => {
    const row = serializeDecisionRow(base);
    const header = "decisions[1]{id,ts,topic,decision,rationale,impact,tags}:";
    const content = `${header}\n${row}`;
    const file = parseDecisionFile(content);
    expect(file.decisions[0]).toMatchObject({
      id: base.id,
      decision: base.decision,
      tags: base.tags,
    });
  });
});
