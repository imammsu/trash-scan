import { mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../model");
const dst = resolve(here, "../public/model");

mkdirSync(dst, { recursive: true });
for (const f of readdirSync(src)) {
  if (f.endsWith(".onnx")) {
    copyFileSync(resolve(src, f), resolve(dst, f));
    console.log("model disalin:", f);
  }
}