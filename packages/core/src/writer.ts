import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Decision, Impact } from "./types.js";
import { generateNextId } from "./idgen.js";
import { parseDecisionFile, serializeDecisionRow } from "./parser.js";
import { buildSummaryBlock } from "./summary.js";

export interface NewDecisionInput {
  topic: string;
  decision: string;
  rationale: string;
  impact: Impact;
  tags: string[];
}

/**
 * Yeni bir DECISIONS.toon dosyası oluşturur.
 */
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

summary{total,high_impact,last_updated,top_topics}:
0,0,${today},
`;
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Dosyanın tablo başlığındaki decisions[N] sayacını günceller.
 * Yalnızca bu satırı değiştirir (atomic: temp file + rename).
 */
function updateDecisionCount(filePath: string, newCount: number): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const updated = content.replace(
    /^decisions\[(\d+)\]\{/m,
    `decisions[${newCount}]{`
  );
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, updated, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

/**
 * Dosyanın summary bloğunu yeniden yazar.
 * Summary bloğu dosyanın sonunda bulunur.
 */
function updateSummaryBlock(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const file = parseDecisionFile(content);
  const summaryBlock = buildSummaryBlock(file);

  // Eski summary bloğunu sil, yenisini ekle
  const summaryStart = content.indexOf("\nsummary{");
  let base: string;
  if (summaryStart >= 0) {
    base = content.slice(0, summaryStart);
  } else {
    base = content.trimEnd();
  }

  const newContent = base + "\n" + summaryBlock + "\n";
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, newContent, "utf-8");
  fs.renameSync(tmpPath, filePath);
}

/**
 * Yeni bir karar ekler. Dosyayı tamamen yeniden yazmaz;
 * sadece yeni satırı append eder, sonra sayacı ve summary'yi günceller.
 */
export function appendDecision(filePath: string, input: NewDecisionInput): Decision {
  if (!fs.existsSync(filePath)) {
    throw new Error(`DECISIONS.toon dosyası bulunamadı: ${filePath}\nÖnce 'decision-memory init' komutunu çalıştırın.`);
  }

  // Mevcut sayacı oku
  const content = fs.readFileSync(filePath, "utf-8");
  const countMatch = content.match(/^decisions\[(\d+)\]/m);
  const currentCount = countMatch ? parseInt(countMatch[1], 10) : 0;

  const id = generateNextId(currentCount);
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:\d{2}Z$/, "Z");

  const decision: Decision = {
    id,
    ts,
    topic: input.topic,
    decision: input.decision,
    rationale: input.rationale,
    impact: input.impact,
    tags: input.tags,
  };

  const row = serializeDecisionRow(decision);

  // Tablo başlık satırının hemen sonrasını bul, yeni satırı ekle
  // Strateji: decisions[N]{...}: satırından sonraki boş satır yerine append
  // Güvenli yol: dosyayı oku, tablo satırlarının sonunu bul, oraya ekle
  const lines = content.split("\n");
  let tableEnd = -1;
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^decisions\[\d+\]\{/.test(lines[i])) {
      inTable = true;
      tableEnd = i;
      continue;
    }
    if (inTable) {
      if (lines[i].startsWith("summary{") || (lines[i] === "" && tableEnd >= 0)) {
        // İlk boş satır veya summary → tablo bitti
        if (lines[i].startsWith("summary{")) {
          tableEnd = i - 1;
        } else {
          tableEnd = i - 1;
        }
        break;
      }
      if (lines[i] !== "") {
        tableEnd = i;
      }
    }
  }

  lines.splice(tableEnd + 1, 0, row);
  const newContent = lines.join("\n");
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, newContent, "utf-8");
  fs.renameSync(tmpPath, filePath);

  // Sayacı güncelle
  updateDecisionCount(filePath, currentCount + 1);

  // Summary'yi güncelle
  updateSummaryBlock(filePath);

  return decision;
}

/**
 * Dosya yolu çözümlemesi: env var → proje kökü → global fallback.
 */
export function resolveDecisionFilePath(cwd?: string): string {
  if (process.env.DECISION_MEMORY_FILE) {
    return process.env.DECISION_MEMORY_FILE;
  }
  const dir = cwd ?? process.cwd();
  const local = path.join(dir, "DECISIONS.toon");
  if (fs.existsSync(local)) return local;

  const globalDir = path.join(os.homedir(), ".decision-memory");
  fs.mkdirSync(globalDir, { recursive: true });
  return path.join(globalDir, "global.toon");
}
