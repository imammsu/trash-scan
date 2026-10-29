import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ensureUid, firebaseSiap, galatAuth, getDb, pesanFirebase } from "./firebase";
import { infoKuis, kuisSelesai, tandaiKuisSelesai, urutanSet, jumlahScan, type TipeKuis } from "./state";
import type { AppConfig, Soal } from "./types";

export function acak<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function setUntuk(tipe: TipeKuis): Promise<"A" | "B"> {
  const uid = await ensureUid();
  const o = urutanSet(uid);
  return tipe === "pre" ? (o[0] as "A" | "B") : (o[1] as "A" | "B");
}

export function pilihSoal(bank: Soal[], set: "A" | "B" | "semua", n: number): Soal[] {
  const pool = set === "semua" ? bank : bank.filter((s) => s.set === set);
  return acak(pool).slice(0, n);
}

/** Post-test dibuka setelah pre-test selesai dan syarat scan atau hari terpenuhi (PRD 10.1). */
export function postTerbuka(cfg: AppConfig): { terbuka: boolean; alasan: string } {
  if (!kuisSelesai("pre")) return { terbuka: false, alasan: "Kerjakan pre-test dulu." };
  if (kuisSelesai("post")) return { terbuka: false, alasan: "Post-test sudah dikerjakan." };
  const pre = infoKuis("pre");
  const hari = pre ? (Date.now() - pre.at) / 86400000 : 0;
  const { postMinScan, postMinHari } = cfg.kuis;
  if (jumlahScan() >= postMinScan || hari >= postMinHari) return { terbuka: true, alasan: "" };
  return {
    terbuka: false,
    alasan: `Post-test dibuka setelah ${postMinScan} scan (sekarang ${jumlahScan()}) atau ${postMinHari} hari sejak pre-test.`,
  };
}

export interface JawabanCatat {
  id: string;
  pilih: number;
  benar: boolean;
}

export interface HasilSimpan {
  ok: boolean;
  sumber: "server" | "lokal" | "tidak";
  /** Penjelasan untuk pengguna/tim bila gagal. */
  alasan?: string;
}

/** Simpan hasil kuis tercatat. Dokumen {uid}_{tipe} hanya bisa di-create sekali. */
export async function simpanKuis(tipe: TipeKuis, jawaban: JawabanCatat[], versi: string): Promise<HasilSimpan> {
  const skor = jawaban.filter((j) => j.benar).length;
  if (!firebaseSiap) {
    tandaiKuisSelesai(tipe, skor, jawaban.length, "lokal"); // mode lokal: tetap dihitung di perangkat
    return { ok: false, sumber: "lokal", alasan: "Firebase belum dikonfigurasi (berkas .env kosong). Skor hanya tersimpan di perangkat ini." };
  }
  const db = getDb();
  const uid = await ensureUid();
  if (!db || !uid) {
    return {
      ok: false,
      sumber: "tidak",
      alasan: galatAuth
        ? pesanFirebase(galatAuth, "kuis")
        : "Login anonim gagal. Periksa API key, authDomain, dan koneksi.",
    };
  }
  try {
    await setDoc(doc(db, "quiz", `${uid}_${tipe}`), {
      uid,
      tipe,
      skor,
      total: jawaban.length,
      jawaban,
      versi,
      createdAt: serverTimestamp(),
    });
    tandaiKuisSelesai(tipe, skor, jawaban.length, "server");
    return { ok: true, sumber: "server" };
  } catch (e) {
    const kode = (e as { code?: string })?.code ?? String(e);
    console.warn("Simpan kuis gagal:", e);
    return { ok: false, sumber: "tidak", alasan: pesanFirebase(kode, "kuis") };
  }
}
