import { z } from "zod";
import { appendDecision } from "../../../core/src/index.js";
import { resolveFilePath } from "../config.js";

export const logDecisionSchema = {
  topic: z.string().describe(
    "Kararın konusu (kebab-case). Örn: auth, database, api-design, testing, deployment"
  ),
  decision: z.string().describe(
    "Alınan somut karar. Net ve spesifik olun: 'JWT RS256 kullan' gibi, 'token kullan' gibi değil"
  ),
  rationale: z.string().describe(
    "Neden bu tercih yapıldı? Alternatifler neden elendi?"
  ),
  impact: z
    .enum(["low", "medium", "high", "critical"])
    .describe(
      "low=stil/araç seçimi, medium=özellik tasarımı, high=mimari, critical=güvenlik/veri"
    ),
  tags: z
    .array(z.string())
    .describe("Aranabilir etiketler. Örn: ['auth', 'jwt', 'security']"),
};

export async function logDecisionHandler(input: {
  topic: string;
  decision: string;
  rationale: string;
  impact: "low" | "medium" | "high" | "critical";
  tags: string[];
}) {
  const filePath = resolveFilePath();
  const entry = appendDecision(filePath, input);
  return {
    content: [
      {
        type: "text" as const,
        text: `Karar kaydedildi: ${entry.id}\nKonu: ${entry.topic}\nKarar: ${entry.decision}`,
      },
    ],
  };
}
