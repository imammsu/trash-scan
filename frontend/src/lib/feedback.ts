import { doc, collection, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { ensureUid, getDb } from "./firebase";
import { batasWaktu } from "./net";

export interface FeedbackInput {
  predicted: string;
  correct: string; // salah satu kelas atau "bukan_sampah"
  box?: [number, number, number, number]; // x, y, w, h relatif 0..1
  imageB64: string;
}

/** Kirim feedback + perbarui users/{uid} dalam satu batch (rules memakai ini untuk pembatasan laju). */
export async function kirimFeedback(f: FeedbackInput): Promise<"ok" | "antre" | "tidak-tersedia" | "ditolak"> {
  const db = getDb();
  const uid = await ensureUid();
  if (!db || !uid) return "tidak-tersedia";
  try {
    const batch = writeBatch(db);
    const fbRef = doc(collection(db, "feedback"));
    batch.set(fbRef, {
      uid,
      predicted: f.predicted,
      correct: f.correct,
      ...(f.box ? { box: f.box } : {}),
      imageB64: f.imageB64,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "users", uid), { lastAt: serverTimestamp(), count: increment(1) });
    await batasWaktu(batch.commit(), 12000);
    return "ok";
  } catch (e) {
    if ((e as Error).message === "timeout") return "antre"; // tulis tertahan, terkirim otomatis saat online
    console.warn("Kirim feedback gagal:", e);
    return "ditolak";
  }
}
