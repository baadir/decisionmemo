import { z } from "zod";
import { appendChange } from "../../../core/src/index.js";
import { resolveFilePath } from "../config.js";

export const logChangeSchema = {
  file: z.string().describe(
    "Değiştirilen dosyanın yolu (örn: src/auth/login.ts)"
  ),
  type: z
    .enum(["added", "modified", "removed", "refactored"])
    .describe(
      "added=yeni dosya eklendi, modified=mevcut dosya değiştirildi, removed=dosya silindi, refactored=yeniden yazıldı"
    ),
  description: z.string().describe(
    "Ne değişti ve neden? (1-2 cümle)"
  ),
};

export async function logChangeHandler(input: {
  file: string;
  type: "added" | "modified" | "removed" | "refactored";
  description: string;
}) {
  const filePath = resolveFilePath();
  const entry = appendChange(filePath, input);
  return {
    content: [
      {
        type: "text" as const,
        text: `Değişiklik kaydedildi: ${entry.id}\nDosya: ${entry.file}\nTür: ${entry.type}\nAçıklama: ${entry.description}`,
      },
    ],
  };
}
