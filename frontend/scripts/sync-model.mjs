import { mkdirSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// 1) Model .onnx: sumber tunggal di /model, disalin ke public/model
const modelSrc = resolve(here, "../../model");
const modelDst = resolve(here, "../public/model");
mkdirSync(modelDst, { recursive: true });
for (const f of readdirSync(modelSrc)) {
  if (f.endsWith(".onnx")) {
    copyFileSync(resolve(modelSrc, f), resolve(modelDst, f));
    console.log("model disalin:", f);
  }
}

// 2) Runtime WASM onnxruntime-web: disajikan sendiri dari public/ort
//    (tidak bergantung CDN, jalan di Firebase Hosting)
const ortSrc = resolve(here, "../node_modules/onnxruntime-web/dist");
const ortDst = resolve(here, "../public/ort");
mkdirSync(ortDst, { recursive: true });
for (const f of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  const from = resolve(ortSrc, f);
  if (!existsSync(from)) {
    console.error(`berkas ORT tidak ditemukan: ${f} (sudah npm ci?)`);
    process.exit(1);
  }
  copyFileSync(from, resolve(ortDst, f));
  console.log("ort disalin:", f);
}
