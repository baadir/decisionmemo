import * as fs from "node:fs";
import {
  parseDecisionFile,
  searchDecisions,
  serializeDecisionRow,
  resolveDecisionFilePath,
} from "../../../core/src/index.js";
import type { Impact } from "../../../core/src/index.js";

interface SearchOptions {
  keywords?: string;
  tags?: string;
  impact?: string;
  limit?: string;
  file?: string;
}

export function searchCommand(options: SearchOptions): void {
  const filePath = options.file ?? resolveDecisionFilePath();

  if (!fs.existsSync(filePath)) {
    console.error(`Hata: ${filePath} bulunamadı. Önce 'decision-memory init' çalıştırın.`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const file = parseDecisionFile(content);

  const keywords = options.keywords
    ? options.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];
  const tags = options.tags
    ? options.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const validImpacts: Impact[] = ["low", "medium", "high", "critical"];
  const impact = validImpacts.includes(options.impact as Impact)
    ? (options.impact as Impact)
    : undefined;
  const limit = options.limit ? parseInt(options.limit, 10) : 5;

  const results = searchDecisions(file, { keywords, tags, impact, limit });

  if (results.length === 0) {
    console.log("Eşleşen karar bulunamadı.");
    return;
  }

  console.log(`decisions[${results.length}]{id,ts,topic,decision,rationale,impact,tags}:`);
  for (const r of results) {
    console.log(serializeDecisionRow(r.decision));
  }
}
