import * as fs from "node:fs";
import {
  parseDecisionFile,
  formatContextSummaryAsToon,
  resolveDecisionFilePath,
} from "../../../core/src/index.js";

interface SummaryOptions {
  file?: string;
  noRecent?: boolean;
}

export function summaryCommand(options: SummaryOptions): void {
  const filePath = options.file ?? resolveDecisionFilePath();

  if (!fs.existsSync(filePath)) {
    console.error(`Hata: ${filePath} bulunamadı. Önce 'decision-memory init' çalıştırın.`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const file = parseDecisionFile(content);

  const output = formatContextSummaryAsToon(file, !options.noRecent);
  console.log(output);
}
