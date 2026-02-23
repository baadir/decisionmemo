import { z } from "zod";
import { appendDecision } from "../../../core/src/index.js";
import { resolveFilePath } from "../config.js";

export const updateDecisionSchema = {
  supersedes_id: z
    .string()
    .describe("Geçersiz kılınan kararın ID'si. Örn: 'D003'"),
  topic: z.string().describe("Yeni kararın konusu"),
  decision: z.string().describe("Yeni alınan karar"),
  rationale: z
    .string()
    .describe("Neden önceki karar değişti? Yeni gerekçe nedir?"),
  impact: z.enum(["low", "medium", "high", "critical"]),
  tags: z.array(z.string()),
};

export async function updateDecisionHandler(input: {
  supersedes_id: string;
  topic: string;
  decision: string;
  rationale: string;
  impact: "low" | "medium" | "high" | "critical";
  tags: string[];
}) {
  const filePath = resolveFilePath();
  // Gerekçeye "supersedes:D003" öneki ekle — izlenebilirlik için
  const enrichedRationale = `[supersedes:${input.supersedes_id}] ${input.rationale}`;

  const entry = appendDecision(filePath, {
    topic: input.topic,
    decision: input.decision,
    rationale: enrichedRationale,
    impact: input.impact,
    tags: [...input.tags, `supersedes:${input.supersedes_id}`],
  });

  return {
    content: [
      {
        type: "text" as const,
        text: `Güncelleme kaydedildi: ${entry.id} → ${input.supersedes_id} kararının yerini aldı.\nYeni karar: ${entry.decision}`,
      },
    ],
  };
}
