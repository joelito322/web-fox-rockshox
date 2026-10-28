import { defineConfig } from "vitest/config";
import { mergeConfig } from "vite";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      // Bound CPU/memory while the published GLB ray/contour regressions run.
      maxWorkers: 2,
      exclude: ["tests/browser/**", "node_modules/**", "dist/**"],
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  }),
);
