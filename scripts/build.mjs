import { spawnSync } from "node:child_process";

const isCloudflare =
  process.env.CF_PAGES === "1" ||
  process.env.CLOUDFLARE_BUILD === "1" ||
  process.env.WRANGLER_CI === "1";
const isInsideOpenNext = process.env.AGCPOS_OPENNEXT_BUILD === "1";
const args = isCloudflare && !isInsideOpenNext ? ["opennextjs-cloudflare", "build"] : ["next", "build"];

const result = spawnSync("npx", ["--yes", ...args], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    AGCPOS_OPENNEXT_BUILD: isCloudflare && !isInsideOpenNext ? "1" : process.env.AGCPOS_OPENNEXT_BUILD,
  },
});

process.exit(result.status ?? 1);
