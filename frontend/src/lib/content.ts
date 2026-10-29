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

const KELAS_VALID = new Set(["anorganik", "b3", "kertas", "organik", "residu"]);
const JENIS_VALID = new Set(["bank_sampah", "b3", "kompos"]);

/** Validasi data lokasi sebelum dirender atau dipakai membuat tautan rute. */
function validasiLokasi(value: unknown): Lokasi[] {
  if (!Array.isArray(value)) throw new Error("Data lokasi harus berupa array.");
  return value.map((raw, i) => {
    if (!raw || typeof raw !== "object") throw new Error(`Data lokasi ke-${i + 1} tidak valid.`);
    const l = raw as Partial<Lokasi>;
    const validString = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
    if (!validString(l.id) || !validString(l.nama) || !validString(l.alamat) || !validString(l.jam) || !validString(l.kontak) || !validString(l.diperbarui)) {
      throw new Error(`Data lokasi ke-${i + 1} memiliki kolom teks yang kosong.`);
    }
    if (!JENIS_VALID.has(String(l.jenis)) || !Array.isArray(l.menerima) || l.menerima.length === 0 || l.menerima.some((k) => !KELAS_VALID.has(String(k)))) {
      throw new Error(`Data lokasi ke-${i + 1} memiliki jenis atau kelas penerimaan yang tidak valid.`);
    }
    if (typeof l.lat !== "number" || l.lat < -90 || l.lat > 90 || typeof l.lng !== "number" || l.lng < -180 || l.lng > 180) {
      throw new Error(`Koordinat lokasi ke-${i + 1} tidak valid.`);
    }
    if (l.statusData !== undefined && l.statusData !== "demo" && l.statusData !== "terverifikasi") {
      throw new Error(`Status data lokasi ke-${i + 1} tidak valid.`);
    }
    return l as Lokasi;
  });
}

export const loadLokasi = () => getJson<unknown>("/data/lokasi.json").then(validasiLokasi);
