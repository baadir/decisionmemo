import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { logDecisionSchema, logDecisionHandler } from "./tools/log_decision.js";
import { searchDecisionsSchema, searchDecisionsHandler } from "./tools/search_decisions.js";
import { getContextSummarySchema, getContextSummaryHandler } from "./tools/get_context_summary.js";
import { updateDecisionSchema, updateDecisionHandler } from "./tools/update_decision.js";

// ÖNEMLİ: MCP server'da console.log KULLANILMAZ.
// stdio transport JSON-RPC iletişimi için stdout kullanır.
// Tüm loglar stderr'e (console.error) gider.

const server = new McpServer({
  name: "decision-memory",
  version: "0.1.0",
});

server.registerTool(
  "log_decision",
  {
    description:
      "Önemli bir mimari veya uygulama kararını kalıcı hafızaya kaydeder. " +
      "Teknoloji seçimi, mimari yaklaşım, güvenlik kararı veya API tasarımı gibi " +
      "önemli tercihler yaptığınızda bu aracı çağırın.",
    inputSchema: logDecisionSchema,
  },
  logDecisionHandler
);

server.registerTool(
  "search_decisions",
  {
    description:
      "Geçmiş kararları keyword veya tag ile arar. " +
      "Mimari bir karar vermeden önce tutarlılığı korumak için veya " +
      "daha önce aynı konuda karar alınıp alınmadığını kontrol etmek için kullanın.",
    inputSchema: searchDecisionsSchema,
  },
  searchDecisionsHandler
);

server.registerTool(
  "get_context_summary",
  {
    description:
      "Tüm geçmiş kararların kompakt özetini döndürür. " +
      "Oturum başında bir kez çağırarak projenin karar geçmişine hakim olun. " +
      "Çıktı ~200 token ile sınırlıdır.",
    inputSchema: getContextSummarySchema,
  },
  getContextSummaryHandler
);

server.registerTool(
  "update_decision",
  {
    description:
      "Önceki bir kararı geçersiz kılarak yeni bir karar kaydeder. " +
      "Bir mimari tercih değiştiğinde veya önceki karar revize edildiğinde kullanın.",
    inputSchema: updateDecisionSchema,
  },
  updateDecisionHandler
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("decision-memory MCP server başlatıldı");
}

main().catch((err) => {
  console.error("MCP server hatası:", err);
  process.exit(1);
});
