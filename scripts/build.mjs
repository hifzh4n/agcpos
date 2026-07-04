import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

rmSync(".next", { force: true, recursive: true, maxRetries: 3, retryDelay: 500 });
rmSync("out", { force: true, recursive: true, maxRetries: 3, retryDelay: 500 });

const result = spawnSync("npx", ["--yes", "next", "build", "--webpack"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
