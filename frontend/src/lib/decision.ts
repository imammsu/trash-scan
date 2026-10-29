import { thresholdFor, type AppConfig } from "./config.ts";
import type { Detection } from "./postprocess.ts";

export type Outcome =
  | { kind: "none" }
  | { kind: "unsure" }
  | {
      kind: "ok";
      /** Semua deteksi yang lolos ambang jepret (untuk digambar). */
      detections: Detection[];
      /** Satu entri per kelas, skor tertinggi lebih dulu (untuk kartu hasil). */
      classes: { classId: number; score: number }[];
    };

/** Deteksi yang digambar di mode live (>= ambang live per kelas). */
export function filterLive(dets: Detection[], cfg: AppConfig): Detection[] {
  return dets.filter((d) => d.score >= thresholdFor(cfg, "live", d.classId));
}

/** Logika keputusan setelah jepret (PRD bagian 7.4). */
export function decideCapture(dets: Detection[], cfg: AppConfig): Outcome {
  const aboveFloor = dets.filter((d) => d.score >= thresholdFor(cfg, "floor", d.classId));
  if (aboveFloor.length === 0) return { kind: "none" };

  const confident = aboveFloor.filter((d) => d.score >= thresholdFor(cfg, "capture", d.classId));
  if (confident.length === 0) return { kind: "unsure" };

  const bestPerClass = new Map<number, number>();
  for (const d of confident) {
    bestPerClass.set(d.classId, Math.max(bestPerClass.get(d.classId) ?? 0, d.score));
  }
  const classes = [...bestPerClass.entries()]
    .map(([classId, score]) => ({ classId, score }))
    .sort((a, b) => b.score - a.score);

  return { kind: "ok", detections: confident, classes };
}
