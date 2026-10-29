import { useEffect, useState } from "react";
import { loadKuis } from "../lib/content";
import { pilihSoal, postTerbuka, setUntuk, simpanKuis, type JawabanCatat } from "../lib/quiz";
import { infoKuis, kuisSelesai, type TipeKuis } from "../lib/state";
import { track } from "../lib/analytics";
import type { AppConfig, Soal } from "../lib/types";

type Mode = TipeKuis | "latihan";
interface Sesi {
  mode: Mode;
  soal: Soal[];
  idx: number;
  jawab: number[];
}

export default function KuisScreen({ cfg }: { cfg: AppConfig }) {
  const [bank, setBank] = useState<{ versi: string; soal: Soal[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [selesai, setSelesai] = useState<{ sesi: Sesi; ok: boolean; alasan?: string; tercatat: boolean } | null>(null);
  const [, paksa] = useState(0);

  useEffect(() => {
    loadKuis().then(setBank).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="pesan"><h2>Kuis gagal dimuat</h2><p>{err}</p></div>;
  if (!bank) return <p className="muted pad">Memuat soal...</p>;

  async function mulai(mode: Mode) {
    const n = cfg.kuis.soalPerSesi;
    let soal: Soal[];
    if (mode === "latihan") soal = pilihSoal(bank!.soal, "semua", n);
    else soal = pilihSoal(bank!.soal, await setUntuk(mode), n);
    setSelesai(null);
    setSesi({ mode, soal, idx: 0, jawab: [] });
  }

  async function pilih(i: number) {
    if (!sesi) return;
    const jawab = [...sesi.jawab, i];
    if (jawab.length < sesi.soal.length) {
      setSesi({ ...sesi, jawab, idx: sesi.idx + 1 });
      return;
    }
    const final = { ...sesi, jawab };
    setSesi(null);
    let ok = false;
    let alasan: string | undefined;
    if (final.mode !== "latihan") {
      const catat: JawabanCatat[] = final.soal.map((s, k) => ({ id: s.id, pilih: final.jawab[k], benar: final.jawab[k] === s.benar }));
      const r = await simpanKuis(final.mode, catat, bank!.versi);
      ok = r.ok;
      alasan = r.alasan;
      track("quiz_complete", { tipe: final.mode, skor: catat.filter((c) => c.benar).length });
    }
    setSelesai({ sesi: final, ok, alasan, tercatat: final.mode !== "latihan" });
    paksa((n) => n + 1);
  }

  // --- sedang mengerjakan ---
  if (sesi) {
    const s = sesi.soal[sesi.idx];
    return (
      <div className="kuis">
        <p className="muted">
          {sesi.mode === "latihan" ? "Latihan" : sesi.mode === "pre" ? "Pre-test" : "Post-test"} · Soal {sesi.idx + 1} dari {sesi.soal.length}
        </p>
        <h2>{s.tanya}</h2>
        <div className="opsi">
          {s.opsi.map((o, i) => (
            <button key={i} className="btn opsi-btn" onClick={() => pilih(i)}>{o}</button>
          ))}
        </div>
        <p className="catatan">Penjelasan jawaban muncul setelah kuis selesai.</p>
      </div>
    );
  }

  // --- hasil ---
  if (selesai) {
    const { sesi: s } = selesai;
    const benar = s.soal.filter((q, k) => s.jawab[k] === q.benar).length;
    return (
      <div className="kuis">
        <h2>Skor kamu {benar} dari {s.soal.length}</h2>
        {selesai.tercatat && selesai.ok && <p className="ok-text">Hasil tercatat secara anonim.</p>}
        {selesai.tercatat && !selesai.ok && (
          <p className="err-text" role="alert">
            Hasil belum tercatat di server. {selesai.alasan} Kamu bisa mengulang tes ini nanti.
          </p>
        )}
        <ol className="review">
          {s.soal.map((q, k) => {
            const ok = s.jawab[k] === q.benar;
            return (
              <li key={q.id} className={ok ? "benar" : "salah"}>
                <strong>{q.tanya}</strong>
                <p>{ok ? "Benar" : "Kurang tepat"}. Jawaban: {q.opsi[q.benar]}</p>
                <p className="muted">{q.penjelasan}</p>
              </li>
            );
          })}
        </ol>
        <button className="btn" onClick={() => setSelesai(null)}>Selesai</button>
      </div>
    );
  }

  // --- menu ---
  const post = postTerbuka(cfg);
  const pre = infoKuis("pre");
  const postInfo = infoKuis("post");
  return (
    <div className="kuis">
      <h2>Kuis pemilahan sampah</h2>
      <p className="muted">Kuis terpisah dari scan. Pre-test dan post-test mengukur apa yang kamu pelajari, hasilnya anonim.</p>

      <section className="menu-item">
        <h3>Pre-test</h3>
        {kuisSelesai("pre") ? (
          <p>Selesai: skor {pre?.skor} dari {pre?.total}.</p>
        ) : (
          <>
            <p>Kerjakan sebelum mulai memakai aplikasi. Boleh dilewati.</p>
            <button className="btn" onClick={() => mulai("pre")}>Mulai pre-test</button>
          </>
        )}
      </section>

      <section className="menu-item">
        <h3>Post-test</h3>
        {kuisSelesai("post") ? (
          <p>Selesai: skor {postInfo?.skor} dari {postInfo?.total}.</p>
        ) : post.terbuka ? (
          <button className="btn" onClick={() => mulai("post")}>Mulai post-test</button>
        ) : (
          <p className="muted">{post.alasan}</p>
        )}
      </section>

      <section className="menu-item">
        <h3>Latihan</h3>
        <p>Soal acak dari seluruh bank. Tidak dicatat dan bisa diulang kapan saja.</p>
        <button className="btn ghost" onClick={() => mulai("latihan")}>Mulai latihan</button>
      </section>
    </div>
  );
}
