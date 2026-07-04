import { spawnSync } from "node:child_process";

const isInsideOpenNext = process.env.AGCPOS_OPENNEXT_BUILD === "1";
const args = isInsideOpenNext ? ["next", "build"] : ["opennextjs-cloudflare", "build"];

const result = spawnSync("npx", ["--yes", ...args], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    AGCPOS_OPENNEXT_BUILD: isInsideOpenNext ? process.env.AGCPOS_OPENNEXT_BUILD : "1",
  },
});

process.exit(result.status ?? 1);
