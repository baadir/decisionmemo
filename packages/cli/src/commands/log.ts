import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { appendDecision, resolveDecisionFilePath } from "../../../core/src/index.js";
import type { Impact, NewDecisionInput } from "../../../core/src/index.js";

interface LogOptions {
  topic?: string;
  decision?: string;
  rationale?: string;
  impact?: string;
  tags?: string;
  file?: string;
}

export async function logCommand(options: LogOptions): Promise<void> {
  // Tüm flag'ler verilmişse doğrudan yaz
  if (options.topic && options.decision && options.rationale && options.impact) {
    const inp = buildInput(options);
    const filePath = options.file ?? resolveDecisionFilePath();
    const entry = appendDecision(filePath, inp);
    console.log(`✓ Karar kaydedildi: ${entry.id} — ${entry.decision}`);
    return;
  }

  // Eksik alanlar için basit readline interaktif mod
  const rl = readline.createInterface({ input, output });

  try {
    const topic = options.topic ?? await rl.question("Konu (örn: auth, database): ");
    const decision = options.decision ?? await rl.question("Alınan karar: ");
    const rationale = options.rationale ?? await rl.question("Gerekçe: ");
    const impactRaw = options.impact ?? await rl.question("Etki (low/medium/high/critical) [medium]: ");
    const tagsRaw = options.tags ?? await rl.question("Etiketler (virgülle, örn: auth,jwt) []: ");

    const filled: LogOptions = {
      topic: topic.trim() || undefined,
      decision: decision.trim() || undefined,
      rationale: rationale.trim() || undefined,
      impact: impactRaw.trim() || "medium",
      tags: tagsRaw.trim(),
    };

    if (!filled.topic || !filled.decision || !filled.rationale) {
      console.error("Hata: Konu, karar ve gerekçe zorunludur.");
      process.exit(1);
    }

    const decisionInput = buildInput(filled);
    const filePath = options.file ?? resolveDecisionFilePath();
    const entry = appendDecision(filePath, decisionInput);
    console.log(`\n✓ Karar kaydedildi: ${entry.id} — ${entry.decision}`);
  } finally {
    rl.close();
  }
}

function buildInput(options: LogOptions): NewDecisionInput {
  const validImpacts: Impact[] = ["low", "medium", "high", "critical"];
  const impact: Impact = validImpacts.includes(options.impact as Impact)
    ? (options.impact as Impact)
    : "medium";

  const tags = options.tags
    ? options.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    topic: options.topic!.trim(),
    decision: options.decision!.trim(),
    rationale: options.rationale!.trim(),
    impact,
    tags,
  };
}
