import { cpSync, rmSync, globSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const wsproom = path.resolve(here, "..");
const web = path.resolve(wsproom, "../wiredsnippets/apps/web");
const storeDirs = globSync(
  path.resolve(wsproom, "../wiredsnippets/node_modules/.pnpm/@wiredsnippets+shroom@*/node_modules/@wiredsnippets/shroom")
);

if (storeDirs.length === 0) {
  console.error("No installed @wiredsnippets/shroom found. Run pnpm install first.");
  process.exit(1);
}

for (const target of storeDirs) {
  for (const dir of ["dist", "dist-esm"]) {
    rmSync(path.join(target, dir), { recursive: true, force: true });
    cpSync(path.join(wsproom, dir), path.join(target, dir), { recursive: true });
  }
  cpSync(path.join(wsproom, "package.json"), path.join(target, "package.json"));
  console.log("Synced ->", target);
}

rmSync(path.join(web, "node_modules/.vite"), { recursive: true, force: true });
console.log("Cleared vite cache.");
