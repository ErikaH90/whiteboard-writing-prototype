import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { createApiApp } from "./server/api.mjs";

function serverApi(): Plugin {
  const api = createApiApp();

  return {
    name: "writing-coach-api",
    configureServer(server) {
      server.middlewares.use(api);
    },
    configurePreviewServer(server) {
      server.middlewares.use(api);
    },
  };
}

export default defineConfig({
  plugins: [react(), serverApi()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});
