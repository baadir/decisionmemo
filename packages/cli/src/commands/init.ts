import * as fs from "node:fs";
import * as path from "node:path";
import { initDecisionFile } from "../../../core/src/index.js";

export function initCommand(options: { project?: string; dir?: string }): void {
  const dir = options.dir ?? process.cwd();
  const filePath = path.join(dir, "DECISIONS.toon");

  if (fs.existsSync(filePath)) {
    console.error(`Hata: ${filePath} zaten mevcut.`);
    process.exit(1);
  }

  const projectName =
    options.project ?? path.basename(dir);

  initDecisionFile(filePath, projectName);

  // .gitattributes kaydı ekle
  const gitattributes = path.join(dir, ".gitattributes");
  const entry = "DECISIONS.toon text eol=lf\n";
  if (fs.existsSync(gitattributes)) {
    const content = fs.readFileSync(gitattributes, "utf-8");
    if (!content.includes("DECISIONS.toon")) {
      fs.appendFileSync(gitattributes, entry);
    }
  } else {
    fs.writeFileSync(gitattributes, entry);
  }

  console.log(`✓ ${filePath} oluşturuldu.`);
  console.log(`✓ .gitattributes güncellendi.`);
  console.log(`\nBaşlamak için:`);
  console.log(`  decision-memory log  # yeni karar ekle`);
  console.log(`  decision-memory summary  # özet görüntüle`);
}
