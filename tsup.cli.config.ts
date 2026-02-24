import { defineConfig } from "tsup";
import { readFileSync } from "fs";
const { version } = JSON.parse(readFileSync("./packages/cli/package.json", "utf8"));

export default defineConfig({
  entry: {
    index: "packages/cli/src/index.ts",
    mcp: "packages/mcp-server/src/index.ts",
  },
  format: ["cjs"],
  dts: false,
  sourcemap: false,
  clean: true,
  outDir: "packages/cli/dist",
  noExternal: ["commander", "@modelcontextprotocol/sdk", "zod"],
  define: { __CLI_VERSION__: JSON.stringify(version) },
  banner: {
    js: "#!/usr/bin/env node",
  },
});
