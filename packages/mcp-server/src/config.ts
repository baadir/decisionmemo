import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

/**
 * Dosya yolu çözümleme önceliği:
 * 1. DECISION_MEMORY_FILE env var
 * 2. ./DECISIONS.toon (process.cwd())
 * 3. ~/.decision-memory/global.toon
 */
export function resolveFilePath(): string {
  if (process.env.DECISION_MEMORY_FILE) {
    return process.env.DECISION_MEMORY_FILE;
  }

  const local = path.join(process.cwd(), "DECISIONS.toon");
  if (fs.existsSync(local)) return local;

  const globalDir = path.join(os.homedir(), ".decision-memory");
  fs.mkdirSync(globalDir, { recursive: true });
  return path.join(globalDir, "global.toon");
}
