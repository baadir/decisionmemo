import * as fs from "node:fs";
import { z } from "zod";
import {
  parseDecisionFile,
  searchDecisions,
  serializeDecisionRow,
} from "../../../core/src/index.js";
import type { Impact } from "../../../core/src/index.js";
import { resolveFilePath } from "../config.js";

export const searchDecisionsSchema = {
  keywords: z
    .array(z.string())
    .optional()
    .describe("Karar metni ve gerekçede aranacak kelimeler"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Filtrelenecek etiketler. Örn: ['auth', 'security']"),
  impact: z
    .enum(["low", "medium", "high", "critical"])
    .optional()
    .describe("Etki seviyesi filtresi"),
  limit: z
    .number()
    .min(1)
    .max(20)
    .default(5)
    .describe("Maksimum sonuç sayısı"),
};

export async function searchDecisionsHandler(input: {
  keywords?: string[];
  tags?: string[];
  impact?: Impact;
  limit: number;
}) {
  const filePath = resolveFilePath();

  if (!fs.existsSync(filePath)) {
    return {
      content: [
        {
          type: "text" as const,
          text: "DECISIONS.toon dosyası bulunamadı. Proje kökünde 'npx decision-memory init' çalıştırın.",
        },
      ],
    };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const file = parseDecisionFile(content);
  const results = searchDecisions(file, {
    keywords: input.keywords,
    tags: input.tags,
    impact: input.impact,
    limit: input.limit,
  });

  if (results.length === 0) {
    return {
      content: [{ type: "text" as const, text: "Eşleşen karar bulunamadı." }],
    };
  }

  // TOON formatında döndür — JSON'dan %39 daha az token
  const header = `decisions[${results.length}]{id,ts,topic,decision,rationale,impact,tags}:`;
  const rows = results.map((r) => serializeDecisionRow(r.decision)).join("\n");

  return {
    content: [{ type: "text" as const, text: `${header}\n${rows}` }],
  };
}
