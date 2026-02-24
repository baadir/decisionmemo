import { defineConfig } from "tsup";

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
  banner: {
    js: "#!/usr/bin/env node",
  },
});
