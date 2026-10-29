import { BatteryWarning, FileText, Leaf, Recycle, Trash2, type LucideIcon } from "lucide-react";
import type { Kelas } from "./types";

export const IKON_KELAS: Record<Kelas, LucideIcon> = {
  anorganik: Recycle,
  b3: BatteryWarning,
  kertas: FileText,
  organik: Leaf,
  residu: Trash2,
};

/** Warna teks yang terbaca di atas warna latar (hex). */
export function teksDi(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? "#1a1a1a" : "#ffffff";
}

export const namaPendek = (nama: string) => nama.replace("Sampah ", "");
