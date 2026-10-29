// Fungsi murni (tanpa DOM/ORT) agar mudah diuji.

export type Box = [number, number, number, number]; // x1, y1, x2, y2 dalam piksel sumber

export interface Detection {
  classId: number;
  score: number;
  box: Box;
}

export interface Letterbox {
  scale: number;
  padX: number;
  padY: number;
  newW: number;
  newH: number;
  size: number;
}

export function computeLetterbox(srcW: number, srcH: number, size: number): Letterbox {
  const scale = Math.min(size / srcW, size / srcH);
  const newW = Math.round(srcW * scale);
  const newH = Math.round(srcH * scale);
  return {
    scale,
    padX: Math.floor((size - newW) / 2),
    padY: Math.floor((size - newH) / 2),
    newW,
    newH,
    size,
  };
}

/**
 * Dekode output YOLO11 (tanpa objectness, tanpa NMS) berbentuk [1, 4+C, N]
 * dengan tata letak channel-major: data[c * N + i].
 * Koordinat model: cx, cy, w, h dalam piksel ruang letterbox.
 */
export function decodeOutput(
  out: Float32Array,
  numCandidates: number,
  numClasses: number,
  minScore: number,
  lb: Letterbox,
  srcW: number,
  srcH: number,
): Detection[] {
  const dets: Detection[] = [];
  const n = numCandidates;
  for (let i = 0; i < n; i++) {
    let best = -1;
    let bestScore = 0;
    for (let c = 0; c < numClasses; c++) {
      const s = out[(4 + c) * n + i];
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (best < 0 || bestScore < minScore) continue;

    const cx = out[i];
    const cy = out[n + i];
    const w = out[2 * n + i];
    const h = out[3 * n + i];

    const x1 = clamp((cx - w / 2 - lb.padX) / lb.scale, 0, srcW);
    const y1 = clamp((cy - h / 2 - lb.padY) / lb.scale, 0, srcH);
    const x2 = clamp((cx + w / 2 - lb.padX) / lb.scale, 0, srcW);
    const y2 = clamp((cy + h / 2 - lb.padY) / lb.scale, 0, srcH);
    if (x2 - x1 < 2 || y2 - y1 < 2) continue;

    dets.push({ classId: best, score: bestScore, box: [x1, y1, x2, y2] });
  }
  return dets;
}

export function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  const union = areaA + areaB - inter;
  return union <= 0 ? 0 : inter / union;
}

/** NMS per kelas, hasil diurutkan dari skor tertinggi dan dibatasi maxDet. */
export function nmsPerClass(dets: Detection[], iouThreshold: number, maxDet: number): Detection[] {
  const sorted = [...dets].sort((a, b) => b.score - a.score);
  const kept: Detection[] = [];
  for (const d of sorted) {
    let suppressed = false;
    for (const k of kept) {
      if (k.classId === d.classId && iou(k.box, d.box) > iouThreshold) {
        suppressed = true;
        break;
      }
    }
    if (!suppressed) {
      kept.push(d);
      if (kept.length >= maxDet) break;
    }
  }
  return kept;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
