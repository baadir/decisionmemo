import * as fs from "node:fs";
import { z } from "zod";
import {
  parseDecisionFile,
  formatContextSummaryAsToon,
} from "../../../core/src/index.js";
import { resolveFilePath } from "../config.js";

export const getContextSummarySchema = {
  include_recent: z
    .boolean()
    .default(true)
    .describe(
      "Son 5 high/critical kararı dahil et. Oturum başında true kullan."
    ),
};

export async function getContextSummaryHandler(input: {
  include_recent: boolean;
}) {
  const filePath = resolveFilePath();

  if (!fs.existsSync(filePath)) {
    return {
      content: [
        {
          type: "text" as const,
          text: "DECISIONS.toon bulunamadı. Bu projede henüz karar kaydedilmemiş.",
        },
      ],
    };
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const file = parseDecisionFile(content);
  const summary = formatContextSummaryAsToon(file, input.include_recent);

  return {
    content: [{ type: "text" as const, text: summary }],
  };
}
