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

  const projectName = options.project ?? path.basename(dir);

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

  // Claude Code entegrasyon dosyalarını kopyala
  const integrationSrc = path.join(__dirname, "..", "integrations", "claude-code");
  if (fs.existsSync(integrationSrc)) {
    copyIntegrationFiles(integrationSrc, dir);
  }

  console.log(`✓ ${filePath} oluşturuldu.`);
  console.log(`✓ .gitattributes güncellendi.`);
  console.log(`✓ .mcp.json, CLAUDE.md, .claude/ kopyalandı.`);
  console.log(`\nSonraki adım: Claude Code'u yeniden başlatın (MCP sunucusu bağlanacak).`);
  console.log(`\nKomutlar:`);
  console.log(`  decision-memory log     # yeni karar ekle`);
  console.log(`  decision-memory summary # özet görüntüle`);
}

function copyIntegrationFiles(src: string, dest: string): void {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyIntegrationFiles(srcPath, destPath);
    } else {
      // Mevcut dosyaların üzerine yazma
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}
