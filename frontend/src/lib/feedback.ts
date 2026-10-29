import { doc, collection, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { ensureUid, firebaseSiap, galatAuth, getDb, pesanFirebase } from "./firebase";

export interface FeedbackInput {
  predicted: string;
  correct: string; // salah satu kelas atau "bukan_sampah"
  box?: [number, number, number, number]; // x, y, w, h relatif 0..1
  imageB64: string;
}

/** Kirim feedback + perbarui users/{uid} dalam satu batch (rules memakai ini untuk pembatasan laju). */
export interface HasilFeedback {
  status: "ok" | "tidak-tersedia" | "ditolak";
  alasan?: string;
}

export async function kirimFeedback(f: FeedbackInput): Promise<HasilFeedback> {
  if (!firebaseSiap) {
    return { status: "tidak-tersedia", alasan: "Firebase belum dikonfigurasi. Feedback belum dikirim." };
  }
  const db = getDb();
  const uid = await ensureUid();
  if (!db || !uid) {
    return { status: "tidak-tersedia", alasan: galatAuth ? pesanFirebase(galatAuth, "feedback") : "Login anonim gagal. Coba lagi." };
  }
  try {
    const batch = writeBatch(db);
    const fbRef = doc(collection(db, "feedback"));
    batch.set(fbRef, {
      uid,
      predicted: f.predicted,
      correct: f.correct,
      status: "pending",
      ...(f.box ? { box: f.box } : {}),
      imageB64: f.imageB64,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "users", uid), { lastAt: serverTimestamp(), count: increment(1) });
    await batch.commit();
    return { status: "ok" };
  } catch (e) {
    console.warn("Kirim feedback gagal:", e);
    const kode = (e as { code?: string })?.code ?? String(e);
    return { status: "ditolak", alasan: pesanFirebase(kode, "feedback") };
  }
}
