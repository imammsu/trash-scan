/** Menolak (dengan "timeout") bila janji tidak selesai dalam ms. Firestore menunda tulis saat offline, bukan menolak. */
export function batasWaktu<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
