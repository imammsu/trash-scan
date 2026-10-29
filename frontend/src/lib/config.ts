export interface ThresholdSet {
  live: number;
  capture: number;
  floor: number;
  nmsIou: number;
  maxDetections: number;
  perClass: Record<string, Partial<Pick<ThresholdSet, "live" | "capture" | "floor">>>;
}

export interface ClassContent {
  nama: string;
  tong: { warna: string; namaWarna: string; label: string; dikonfirmasi: boolean };
  peringatan?: string;
  panduan: string[];
  edukasi: { waktuTerurai: string; dampak: string; sdg: string[] };
}

export interface AppConfig {
  model: { url: string; inputSize: number };
  classes: string[];
  thresholds: ThresholdSet;
  liveIntervalMs: number;
  content: Record<string, ClassContent>;
}

export type ThresholdKey = "live" | "capture" | "floor";

/** Ambang untuk satu kelas; memakai override per kelas bila ada. */
export function thresholdFor(cfg: AppConfig, key: ThresholdKey, classId: number): number {
  const name = cfg.classes[classId];
  return cfg.thresholds.perClass[name]?.[key] ?? cfg.thresholds[key];
}

/** Ambang terendah di semua kelas, dipakai sebagai batas awal saat decode. */
export function minThreshold(cfg: AppConfig, key: ThresholdKey): number {
  return Math.min(...cfg.classes.map((_, i) => thresholdFor(cfg, key, i)));
}

export async function loadConfig(): Promise<AppConfig> {
  const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Gagal memuat config.json (${res.status})`);
  const cfg = (await res.json()) as AppConfig;
  for (const name of cfg.classes) {
    if (!cfg.content[name]) throw new Error(`config.json: konten untuk kelas "${name}" belum ada`);
  }
  return cfg;
}
