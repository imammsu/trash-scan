import * as ort from "onnxruntime-web";
import type { Ambang, AppConfig, Detection, HasilScan, Kelas } from "./types";
import type { Sumber } from "./image";

// Hanya .wasm yang diarahkan ke /public. Loader .mjs memakai versi yang sudah tertanam di bundle
// (mengimpor .mjs dari /public ditolak Vite dev server).
ort.env.wasm.wasmPaths = { wasm: "/ort/ort-wasm-simd-threaded.jsep.wasm" } as unknown as typeof ort.env.wasm.wasmPaths;
ort.env.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 1);

const N_KELAS = 5;
const N_KANDIDAT = 3549;

export interface Detector {
  detect(src: Sumber, sw: number, sh: number): Promise<Detection[]>;
}

/** Unduh model dengan progres (0..1, atau -1 bila ukuran tidak diketahui). */
async function unduh(url: string, onProgress: (p: number) => void): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Model gagal diunduh (${res.status})`);
  const total = Number(res.headers.get("Content-Length")) || 0;
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    onProgress(total ? Math.min(1, got / total) : -1);
  }
  const out = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export async function muatDetector(cfg: AppConfig, onProgress: (p: number) => void): Promise<Detector> {
  const buf = await unduh(cfg.model.url, onProgress);
  let session: ort.InferenceSession;
  let pakaiWebgpu = true;
  try {
    session = await ort.InferenceSession.create(buf, { executionProviders: ["webgpu", "wasm"] });
  } catch {
    pakaiWebgpu = false;
    session = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });
  }

  const S = cfg.model.ukuran;
  const work = document.createElement("canvas");
  work.width = S;
  work.height = S;
  const wctx = work.getContext("2d", { willReadFrequently: true })!;
  const nms = cfg.ambang.nmsIou;
  const floor = cfg.ambang.floor;
  const namaKelas = cfg.kelas;

  async function jalankan(src: Sumber, sw: number, sh: number): Promise<Detection[]> {
    // 1. Letterbox: jaga rasio, isi sisa dengan abu-abu 114
    const scale = Math.min(S / sw, S / sh);
    const nw = Math.round(sw * scale);
    const nh = Math.round(sh * scale);
    const padX = Math.floor((S - nw) / 2);
    const padY = Math.floor((S - nh) / 2);
    wctx.fillStyle = "rgb(114,114,114)";
    wctx.fillRect(0, 0, S, S);
    wctx.drawImage(src as CanvasImageSource, 0, 0, sw, sh, padX, padY, nw, nh);
    const px = wctx.getImageData(0, 0, S, S).data;

    // 2. RGBA HWC -> RGB NCHW, 0..1
    const plane = S * S;
    const input = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      input[i] = px[i * 4] / 255;
      input[plane + i] = px[i * 4 + 1] / 255;
      input[2 * plane + i] = px[i * 4 + 2] / 255;
    }

    // 3. Inferensi
    let out: ort.InferenceSession.OnnxValueMapType;
    try {
      out = await session.run({ images: new ort.Tensor("float32", input, [1, 3, S, S]) });
    } catch (e) {
      // WebGPU kadang gagal saat dijalankan (bukan saat dibuat): pindah ke WASM lalu ulangi sekali.
      if (!pakaiWebgpu) throw e;
      console.warn("WebGPU gagal, beralih ke WASM:", e);
      pakaiWebgpu = false;
      session = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });
      out = await session.run({ images: new ort.Tensor("float32", input, [1, 3, S, S]) });
    }
    const data = out["output0"].data as Float32Array; // [1, 4+5, 3549]

    // 4. Dekode: kelas dengan skor tertinggi per kandidat
    const cand: Detection[] = [];
    for (let i = 0; i < N_KANDIDAT; i++) {
      let best = -1;
      let bestScore = 0;
      for (let c = 0; c < N_KELAS; c++) {
        const s = data[(4 + c) * N_KANDIDAT + i];
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      if (best < 0 || bestScore < floor) continue;
      const cx = data[i];
      const cy = data[N_KANDIDAT + i];
      const w = data[2 * N_KANDIDAT + i];
      const h = data[3 * N_KANDIDAT + i];
      // 5. Kembalikan ke koordinat sumber
      let x1 = (cx - w / 2 - padX) / scale;
      let y1 = (cy - h / 2 - padY) / scale;
      let x2 = (cx + w / 2 - padX) / scale;
      let y2 = (cy + h / 2 - padY) / scale;
      x1 = Math.max(0, Math.min(sw, x1));
      y1 = Math.max(0, Math.min(sh, y1));
      x2 = Math.max(0, Math.min(sw, x2));
      y2 = Math.max(0, Math.min(sh, y2));
      if (x2 - x1 < 2 || y2 - y1 < 2) continue;
      cand.push({ cls: best, kelas: namaKelas[best], score: bestScore, x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
    }
    return nmsPerKelas(cand, nms).slice(0, 20);
  }

  // Satu inferensi pada satu waktu: kanvas kerja dan sesi dipakai bersama oleh loop live,
  // jepret, dan unggah, sehingga panggilan bersamaan harus diantrekan.
  let antrean: Promise<unknown> = Promise.resolve();
  function detect(src: Sumber, sw: number, sh: number): Promise<Detection[]> {
    const p = antrean.then(() => jalankan(src, sw, sh));
    antrean = p.catch(() => undefined);
    return p;
  }

  return { detect };
}

function iou(a: Detection, b: Detection): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const uni = a.w * a.h + b.w * b.h - inter;
  return uni > 0 ? inter / uni : 0;
}

function nmsPerKelas(dets: Detection[], thr: number): Detection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const keep: Detection[] = [];
  for (const d of sorted) {
    if (!keep.some((k) => k.cls === d.cls && iou(k, d) > thr)) keep.push(d);
  }
  return keep;
}

// ---- Ambang dan keputusan ----

export function ambangKelas(a: Ambang, k: Kelas, jenis: "live" | "capture"): number {
  return a.perKelas[k]?.[jenis] ?? a[jenis];
}

export function saringLive(dets: Detection[], a: Ambang): Detection[] {
  return dets.filter((d) => d.score >= ambangKelas(a, d.kelas, "live"));
}

export interface Keputusan {
  hasil: HasilScan;
  deteksi: Detection[]; // hanya terisi saat hasil === "ok"
}

/** Logika keputusan setelah jepret atau unggah (PRD 7.4). */
export function putuskan(dets: Detection[], a: Ambang): Keputusan {
  const kandidat = dets.filter((d) => d.score >= a.floor);
  if (kandidat.length === 0) return { hasil: "kosong", deteksi: [] };
  const memadai = kandidat
    .filter((d) => d.score >= ambangKelas(a, d.kelas, "capture"))
    .sort((x, y) => y.score - x.score);
  if (memadai.length === 0) return { hasil: "ragu", deteksi: [] };
  return { hasil: "ok", deteksi: memadai };
}
