import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Deletes the test accounts created during the run.
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/fr",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
