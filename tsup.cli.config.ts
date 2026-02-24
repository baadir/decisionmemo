import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "packages/cli/src/index.ts",
    mcp: "packages/mcp-server/src/index.ts",
  },
  format: ["esm"],
  dts: false,
  sourcemap: false,
  clean: false,
  outDir: "packages/cli/dist",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
