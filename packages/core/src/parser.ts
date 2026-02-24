import type { Change, ChangeType, Decision, DecisionFile, DecisionFileMeta, Impact } from "./types.js";

/**
 * Tırnak işaretlerine saygı duyarak CSV satırını alanlara ayırır.
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
        const next = line[i + 1];
        if (next === '"') { current += '"'; i += 2; continue; }
        else if (next === "n") { current += "\n"; i += 2; continue; }
        else if (next === "\\") { current += "\\"; i += 2; continue; }
        current += ch;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { fields.push(current); current = ""; }
      else { current += ch; }
    }
    i++;
  }
  fields.push(current);
  return fields;
}

function parseDecisionsHeader(line: string): { count: number; fields: string[] } | null {
  const match = line.match(/^decisions\[(\d+)\]\{([^}]+)\}:$/);
  if (!match) return null;
  return { count: parseInt(match[1], 10), fields: match[2].split(",") };
}

function parseChangesHeader(line: string): { count: number; fields: string[] } | null {
  const match = line.match(/^changes\[(\d+)\]\{([^}]+)\}:$/);
  if (!match) return null;
  return { count: parseInt(match[1], 10), fields: match[2].split(",") };
}

function isSummaryLine(line: string): boolean {
  return line.startsWith("summary{");
}

function parseDecisionRow(fields: string[], values: string[]): Decision {
  const get = (name: string): string => {
    const idx = fields.indexOf(name);
    return idx >= 0 ? values[idx] ?? "" : "";
  };
  const impactRaw = get("impact");
  const validImpacts: Impact[] = ["low", "medium", "high", "critical"];
  const impact: Impact = validImpacts.includes(impactRaw as Impact) ? (impactRaw as Impact) : "medium";
  const tagsRaw = get("tags");
  const tags = tagsRaw ? tagsRaw.split("|").filter(Boolean) : [];
  return { id: get("id"), ts: get("ts"), topic: get("topic"), decision: get("decision"), rationale: get("rationale"), impact, tags };
}

function parseChangeRow(fields: string[], values: string[]): Change {
  const get = (name: string): string => {
    const idx = fields.indexOf(name);
    return idx >= 0 ? values[idx] ?? "" : "";
  };
  const typeRaw = get("type");
  const validTypes: ChangeType[] = ["added", "modified", "removed", "refactored"];
  const type: ChangeType = validTypes.includes(typeRaw as ChangeType) ? (typeRaw as ChangeType) : "modified";
  return { id: get("id"), ts: get("ts"), file: get("file"), type, description: get("description") };
}

export function parseDecisionFile(content: string): DecisionFile {
  const lines = content.split("\n");
  const meta: DecisionFileMeta = {
    project: "unknown", version: "1",
    created: new Date().toISOString().slice(0, 10),
    updated: new Date().toISOString().slice(0, 10),
  };
  const decisions: Decision[] = [];
  const changes: Change[] = [];
  let tableFields: string[] = [];
  let inDecisions = false;
  let inChanges = false;
  let inSummary = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith("#")) continue;
    if (isSummaryLine(line)) { inDecisions = false; inChanges = false; inSummary = true; continue; }
    if (inSummary) continue;

    const decisionsHeader = parseDecisionsHeader(line);
    if (decisionsHeader) { tableFields = decisionsHeader.fields; inDecisions = true; inChanges = false; continue; }

    const changesHeader = parseChangesHeader(line);
    if (changesHeader) { tableFields = changesHeader.fields; inChanges = true; inDecisions = false; continue; }

    if (inDecisions && tableFields.length > 0) {
      const values = splitCsvRow(line);
      if (values.length >= tableFields.length) decisions.push(parseDecisionRow(tableFields, values));
      continue;
    }
    if (inChanges && tableFields.length > 0) {
      const values = splitCsvRow(line);
      if (values.length >= tableFields.length) changes.push(parseChangeRow(tableFields, values));
      continue;
    }

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
  return { meta, decisions, changes };
}

const escapeField = (s: string): string => {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n") + '"';
  }
  return s;
};

export function serializeDecisionRow(d: Decision): string {
  const tags = d.tags.join("|");
  return [d.id, d.ts, d.topic, escapeField(d.decision), escapeField(d.rationale), d.impact, tags].join(",");
}

export function serializeChangeRow(c: Change): string {
  return [c.id, c.ts, escapeField(c.file), c.type, escapeField(c.description)].join(",");
}
