import * as ort from "onnxruntime-web/wasm";
import { computeLetterbox, decodeOutput, nmsPerClass, type Detection } from "./postprocess.ts";

// Runtime WASM disajikan dari public/ort (disalin oleh scripts/sync-model.mjs).
ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}ort/`;
// Satu thread: multi-thread butuh cross-origin isolation yang tidak ada di Firebase Hosting default.
ort.env.wasm.numThreads = 1;

export interface DetectOptions {
  minScore: number;
  nmsIou: number;
  maxDetections: number;
}

export type ProgressFn = (loadedBytes: number, totalBytes: number) => void;

export class Detector {
  private session: ort.InferenceSession;
  private inputName: string;
  private outputName: string;
  private size: number;
  private numClasses: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private queue: Promise<unknown> = Promise.resolve();

  private constructor(session: ort.InferenceSession, size: number, numClasses: number) {
    this.session = session;
    this.size = size;
    this.numClasses = numClasses;
    this.inputName = session.inputNames[0];
    this.outputName = session.outputNames[0];
    this.canvas = document.createElement("canvas");
    this.canvas.width = size;
    this.canvas.height = size;
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas 2D tidak tersedia di browser ini");
    this.ctx = ctx;
  }

  static async create(
    modelUrl: string,
    size: number,
    numClasses: number,
    onProgress?: ProgressFn,
  ): Promise<Detector> {
    const bytes = await fetchWithProgress(modelUrl, onProgress);
    const session = await ort.InferenceSession.create(bytes, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    const detector = new Detector(session, size, numClasses);
    // Pemanasan: inferensi pertama biasanya jauh lebih lambat.
    await detector.run(new Float32Array(3 * size * size));
    return detector;
  }

  /** Jalankan deteksi pada frame video/canvas. Pemanggilan dijalankan berurutan. */
  detect(source: CanvasImageSource, srcW: number, srcH: number, opts: DetectOptions): Promise<Detection[]> {
    const job = this.queue.then(async () => {
      const lb = computeLetterbox(srcW, srcH, this.size);
      const input = this.preprocess(source, srcW, srcH, lb);
      const { data, numCandidates } = await this.run(input);
      const raw = decodeOutput(data, numCandidates, this.numClasses, opts.minScore, lb, srcW, srcH);
      return nmsPerClass(raw, opts.nmsIou, opts.maxDetections);
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  private preprocess(
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    lb: ReturnType<typeof computeLetterbox>,
  ): Float32Array {
    const { ctx, size } = this;
    ctx.fillStyle = "rgb(114,114,114)";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(source, 0, 0, srcW, srcH, lb.padX, lb.padY, lb.newW, lb.newH);
    const rgba = ctx.getImageData(0, 0, size, size).data;
    const plane = size * size;
    const out = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      out[i] = rgba[i * 4] / 255;
      out[plane + i] = rgba[i * 4 + 1] / 255;
      out[2 * plane + i] = rgba[i * 4 + 2] / 255;
    }
    return out;
  }

  private async run(input: Float32Array): Promise<{ data: Float32Array; numCandidates: number }> {
    const tensor = new ort.Tensor("float32", input, [1, 3, this.size, this.size]);
    const results = await this.session.run({ [this.inputName]: tensor });
    const out = results[this.outputName];
    // Bentuk [1, 4 + C, N]
    return { data: out.data as Float32Array, numCandidates: out.dims[2] };
  }
}

async function fetchWithProgress(url: string, onProgress?: ProgressFn): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengunduh model (${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onProgress?.(buf.length, buf.length);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  return bytes;
}

// Satu kali muat per sesi halaman (aman terhadap StrictMode); direset bila gagal agar bisa dicoba lagi.
let loading: Promise<Detector> | null = null;
let progressListener: ProgressFn | undefined;
export function loadDetector(
  modelUrl: string,
  size: number,
  numClasses: number,
  onProgress?: ProgressFn,
): Promise<Detector> {
  progressListener = onProgress; // pemanggil terbaru yang menerima progres (mis. mount ulang StrictMode)
  if (!loading) {
    loading = Detector.create(modelUrl, size, numClasses, (l, t) => progressListener?.(l, t)).catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}
