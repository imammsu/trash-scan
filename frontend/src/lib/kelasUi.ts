// Atribut tampilan per kelas. Warna tetap diambil dari config.json (konvensi tong mitra).
import type { CSSProperties } from "react";
import type { AppConfig, Kelas } from "./types";

export const IKON_KELAS: Record<Kelas, string> = {
  anorganik: "recycling",
  b3: "warning",
  kertas: "description",
  organik: "eco",
  residu: "delete",
};

/** Warna teks yang terbaca di atas warna tong (kuning butuh teks gelap). */
export const teksDiAtas = (k: Kelas) => (k === "anorganik" ? "#1a1a1a" : "#ffffff");

export const namaPendek = (cfg: AppConfig, k: Kelas) =>
  k === "b3" ? "B3" : cfg.kelasDetail[k].nama.replace("Sampah ", "");

/** Variabel CSS --k (warna kelas) untuk komponen bertema kelas. */
export const varKelas = (cfg: AppConfig, k: Kelas): CSSProperties =>
  ({ "--k": cfg.kelasDetail[k].tong.warna, "--k-ink": teksDiAtas(k) }) as CSSProperties;
