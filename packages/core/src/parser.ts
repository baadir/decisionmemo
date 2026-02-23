import type { Decision, DecisionFile, DecisionFileMeta, Impact } from "./types.js";

/**
 * Tırnak işaretlerine saygı duyarak CSV satırını alanlara ayırır.
 * Bu fonksiyon projenin en kritik kodudur.
 * Kararlar içinde virgül bulunabilir; regex ile split yapmak yanlış sonuç verir.
 */
export function splitCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuote = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if (inQuote) {
      if (ch === "\\") {
        // Escape sekansı
        const next = line[i + 1];
        if (next === '"') {
          current += '"';
          i += 2;
          continue;
        } else if (next === "n") {
          current += "\n";
          i += 2;
          continue;
        } else if (next === "\\") {
          current += "\\";
          i += 2;
          continue;
        }
        current += ch;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    i++;
  }

  fields.push(current);
  return fields;
}

/**
 * TOON tablo başlığını ayrıştırır: "decisions[14]{id,ts,topic,...}"
 * Döndürür: { count: 14, fields: ["id", "ts", "topic", ...] }
 */
function parseTableHeader(line: string): { count: number; fields: string[] } | null {
  const match = line.match(/^decisions\[(\d+)\]\{([^}]+)\}:$/);
  if (!match) return null;
  return {
    count: parseInt(match[1], 10),
    fields: match[2].split(","),
  };
}

/**
 * Summary satırını ayrıştırır: "summary{...}:"
 */
function isSummaryLine(line: string): boolean {
  return line.startsWith("summary{");
}

/**
 * Karar satırını ayrıştırır, Impact enum kontrolü yapar.
 */
function parseDecisionRow(fields: string[], values: string[]): Decision {
  const get = (name: string): string => {
    const idx = fields.indexOf(name);
    return idx >= 0 ? values[idx] ?? "" : "";
  };

  const impactRaw = get("impact");
  const validImpacts: Impact[] = ["low", "medium", "high", "critical"];
  const impact: Impact = validImpacts.includes(impactRaw as Impact)
    ? (impactRaw as Impact)
    : "medium";

  const tagsRaw = get("tags");
  const tags = tagsRaw ? tagsRaw.split("|").filter(Boolean) : [];

  return {
    id: get("id"),
    ts: get("ts"),
    topic: get("topic"),
    decision: get("decision"),
    rationale: get("rationale"),
    impact,
    tags,
  };
}

/**
 * TOON dosyasının tüm içeriğini ayrıştırır.
 */
export function parseDecisionFile(content: string): DecisionFile {
  const lines = content.split("\n");

  const meta: DecisionFileMeta = {
    project: "unknown",
    version: "1",
    created: new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
  };

  const decisions: Decision[] = [];
  let tableFields: string[] = [];
  let inTable = false;
  let inSummary = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Yorum ve boş satırları atla
    if (!line || line.startsWith("#")) continue;

    // Summary bloğuna girildi mi?
    if (isSummaryLine(line)) {
      inTable = false;
      inSummary = true;
      continue;
    }

    // Summary içindeki satırları atla
    if (inSummary) continue;

    // Tablo başlığı
    const tableHeader = parseTableHeader(line);
    if (tableHeader) {
      tableFields = tableHeader.fields;
      inTable = true;
      continue;
    }

    // Tablo satırları
    if (inTable && tableFields.length > 0) {
      const values = splitCsvRow(line);
      if (values.length >= tableFields.length) {
        decisions.push(parseDecisionRow(tableFields, values));
      }
      continue;
    }

    // Meta alanlar (key: value)
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (key === "project") meta.project = value;
      else if (key === "version") meta.version = value;
      else if (key === "created") meta.created = value;
      else if (key === "updated") meta.updated = value;
    }
  }

  return { meta, decisions };
}

/**
 * Bir Decision nesnesini TOON tablo satırına dönüştürür.
 */
export function serializeDecisionRow(d: Decision): string {
  const escapeField = (s: string): string => {
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
    }
    return s;
  };

  const tags = d.tags.join("|");
  return [
    d.id,
    d.ts,
    d.topic,
    escapeField(d.decision),
    escapeField(d.rationale),
    d.impact,
    tags,
  ].join(",");
}
