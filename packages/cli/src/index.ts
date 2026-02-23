import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { logCommand } from "./commands/log.js";
import { searchCommand } from "./commands/search.js";
import { summaryCommand } from "./commands/summary.js";

const program = new Command();

program
  .name("decision-memory")
  .description("Claude Code için karar hafızası aracı")
  .version("0.1.0");

program
  .command("init")
  .description("Proje kökünde DECISIONS.toon dosyası oluşturur")
  .option("-p, --project <name>", "Proje adı")
  .option("-d, --dir <path>", "Dizin (varsayılan: çalışma dizini)")
  .action((options) => initCommand(options));

program
  .command("log")
  .description("Yeni bir karar ekler (interaktif veya flag'lerle)")
  .option("-t, --topic <topic>", "Konu (örn: auth, database)")
  .option("-d, --decision <text>", "Alınan karar")
  .option("-r, --rationale <text>", "Gerekçe")
  .option("-i, --impact <level>", "Etki: low|medium|high|critical")
  .option("--tags <tags>", "Etiketler (virgülle ayrılmış)")
  .option("-f, --file <path>", "DECISIONS.toon dosya yolu")
  .action(async (options) => {
    await logCommand(options);
  });

program
  .command("search")
  .description("Geçmiş kararlarda arama yapar")
  .option("-k, --keywords <words>", "Anahtar kelimeler (virgülle ayrılmış)")
  .option("--tags <tags>", "Etiketler (virgülle ayrılmış)")
  .option("--impact <level>", "Etki filtresi: low|medium|high|critical")
  .option("-n, --limit <n>", "Maksimum sonuç sayısı", "5")
  .option("-f, --file <path>", "DECISIONS.toon dosya yolu")
  .action((options) => searchCommand(options));

program
  .command("summary")
  .description("Kararların özetini görüntüler")
  .option("--no-recent", "Son kararları dahil etme")
  .option("-f, --file <path>", "DECISIONS.toon dosya yolu")
  .action((options) => summaryCommand(options));

program.parse();
