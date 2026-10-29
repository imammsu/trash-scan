import type { AppConfig, KamusEntry, Lokasi, Soal } from "./types";

const cache = new Map<string, Promise<unknown>>();

function getJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = fetch(path).then((r) => {
      if (!r.ok) throw new Error(`Gagal memuat ${path} (${r.status})`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path)); // izinkan coba lagi
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export const loadConfig = () => getJson<AppConfig>("/config.json");
export const loadKamus = () => getJson<KamusEntry[]>("/data/kamus.json");
export const loadKuis = () => getJson<{ versi: string; soal: Soal[] }>("/data/kuis.json");
export const loadLokasi = () => getJson<Lokasi[]>("/data/lokasi.json");
