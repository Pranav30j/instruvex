import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "https://id-preview--faf33587-5559-4f53-a0e5-182057e1fb66.lovable.app",
  },
});
