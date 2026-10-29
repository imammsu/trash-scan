// Menyalin model ONNX (sumber tunggal: /model) dan berkas WASM onnxruntime-web
// ke public/ agar disajikan dari Firebase Hosting (tanpa CDN pihak ketiga).
import { mkdirSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const modelSrc = resolve(here, "../../model");
const modelDst = resolve(here, "../public/model");
mkdirSync(modelDst, { recursive: true });
for (const f of readdirSync(modelSrc)) {
  if (f.endsWith(".onnx")) {
    copyFileSync(resolve(modelSrc, f), resolve(modelDst, f));
    console.log("model disalin:", f);
  }
}

const ortSrc = resolve(here, "../node_modules/onnxruntime-web/dist");
const ortDst = resolve(here, "../public/ort");
if (existsSync(ortSrc)) {
  mkdirSync(ortDst, { recursive: true });
  // Hanya WASM varian JSEP (mendukung WebGPU dan fallback WASM). Loader .mjs sudah tertanam di bundle.
  const want = /^ort-wasm-simd-threaded\.jsep\.wasm$/;
  for (const f of readdirSync(ortSrc)) {
    if (want.test(f)) {
      copyFileSync(resolve(ortSrc, f), resolve(ortDst, f));
      console.log("ort disalin:", f);
    }
  }
}
