import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Change, ChangeType, Decision, Impact } from "./types.js";
import { generateNextChangeId, generateNextId } from "./idgen.js";
import { parseDecisionFile, serializeChangeRow, serializeDecisionRow } from "./parser.js";
import { buildSummaryBlock } from "./summary.js";

export interface NewDecisionInput {
  topic: string;
  decision: string;
  rationale: string;
  impact: Impact;
  tags: string[];
}

export interface NewChangeInput {
  file: string;
  type: ChangeType;
  description: string;
}

export function initDecisionFile(filePath: string, projectName: string): void {
  if (fs.existsSync(filePath)) {
    throw new Error(`Dosya zaten var: ${filePath}`);
  }
  const today = new Date().toISOString().slice(0, 10);
  const content = `# decision-memory v1
project: ${projectName}
version: 1
created: ${today}
updated: ${today}

decisions[0]{id,ts,topic,decision,rationale,impact,tags}:

changes[0]{id,ts,file,type,description}:

summary{total,high_impact,last_updated,top_topics}:
0,0,${today},
`;
  fs.writeFileSync(filePath, content, "utf-8");
}

function updateDecisionCount(filePath: string, newCount: number): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const updated = content.replace(/^decisions\[(\d+)\]\{/m, `decisions[${newCount}]{`);
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, updated, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

function updateChangeCount(filePath: string, newCount: number): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const updated = content.replace(/^changes\[(\d+)\]\{/m, `changes[${newCount}]{`);
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, updated, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

function updateSummaryBlock(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const file = parseDecisionFile(content);
  const summaryBlock = buildSummaryBlock(file);
  const summaryStart = content.indexOf("\nsummary{");
  const base = summaryStart >= 0 ? content.slice(0, summaryStart) : content.trimEnd();
  const newContent = base + "\n" + summaryBlock + "\n";
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, newContent, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export function appendDecision(filePath: string, input: NewDecisionInput): Decision {
  if (!fs.existsSync(filePath)) {
    throw new Error(`DECISIONS.toon dosyası bulunamadı: ${filePath}\nÖnce 'decision-memory init' komutunu çalıştırın.`);
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const countMatch = content.match(/^decisions\[(\d+)\]/m);
  const currentCount = countMatch ? parseInt(countMatch[1], 10) : 0;

  const id = generateNextId(currentCount);
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:\d{2}Z$/, "Z");
  const decision: Decision = { id, ts, topic: input.topic, decision: input.decision, rationale: input.rationale, impact: input.impact, tags: input.tags };
  const row = serializeDecisionRow(decision);

  const lines = content.split("\n");
  let tableEnd = -1;
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^decisions\[\d+\]\{/.test(lines[i])) { inTable = true; tableEnd = i; continue; }
    if (inTable) {
      if (lines[i].startsWith("summary{") || lines[i].startsWith("changes[")) { tableEnd = i - 1; break; }
      if (lines[i] !== "") tableEnd = i;
    }
  }
  lines.splice(tableEnd + 1, 0, row);
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, lines.join("\n"), "utf-8");
  fs.renameSync(tmpPath, filePath);

  updateDecisionCount(filePath, currentCount + 1);
  updateSummaryBlock(filePath);
  return decision;
}

export function appendChange(filePath: string, input: NewChangeInput): Change {
  if (!fs.existsSync(filePath)) {
    throw new Error(`DECISIONS.toon dosyası bulunamadı: ${filePath}\nÖnce 'decision-memory init' komutunu çalıştırın.`);
  }

  let content = fs.readFileSync(filePath, "utf-8");

  // changes bölümü yoksa summary'den önce ekle
  if (!/^changes\[/m.test(content)) {
    const summaryStart = content.indexOf("\nsummary{");
    const insertPoint = summaryStart >= 0 ? summaryStart : content.length;
    content = content.slice(0, insertPoint) + "\nchanges[0]{id,ts,file,type,description}:\n" + content.slice(insertPoint);
    const tmpPath = filePath + ".tmp";
    fs.writeFileSync(tmpPath, content, "utf-8");
    fs.renameSync(tmpPath, filePath);
    content = fs.readFileSync(filePath, "utf-8");
  }

  const countMatch = content.match(/^changes\[(\d+)\]/m);
  const currentCount = countMatch ? parseInt(countMatch[1], 10) : 0;

  const id = generateNextChangeId(currentCount);
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:\d{2}Z$/, "Z");
  const change: Change = { id, ts, file: input.file, type: input.type, description: input.description };
  const row = serializeChangeRow(change);

  const lines = content.split("\n");
  let tableEnd = -1;
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^changes\[\d+\]\{/.test(lines[i])) { inTable = true; tableEnd = i; continue; }
    if (inTable) {
      if (lines[i].startsWith("summary{")) { tableEnd = i - 1; break; }
      if (lines[i] !== "") tableEnd = i;
    }
  }
  lines.splice(tableEnd + 1, 0, row);
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, lines.join("\n"), "utf-8");
  fs.renameSync(tmpPath, filePath);

  updateChangeCount(filePath, currentCount + 1);
  return change;
}

export function resolveDecisionFilePath(cwd?: string): string {
  if (process.env.DECISION_MEMORY_FILE) return process.env.DECISION_MEMORY_FILE;
  const dir = cwd ?? process.cwd();
  const local = path.join(dir, "DECISIONS.toon");
  if (fs.existsSync(local)) return local;
  const globalDir = path.join(os.homedir(), ".decision-memory");
  fs.mkdirSync(globalDir, { recursive: true });
  return path.join(globalDir, "global.toon");
}
