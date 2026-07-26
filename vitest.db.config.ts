import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Load .env.local into process.env for the DB harness (no dotenv dependency).
try {
  const raw = readFileSync(new URL("./.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // .env.local absent — tests will skip with a clear message.
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.{test,spec}.ts"],
    // Staging is shared state: never run DB test files in parallel.
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
