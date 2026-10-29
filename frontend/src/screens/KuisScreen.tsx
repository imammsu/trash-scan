import { useEffect, useState } from "react";
import { CircleCheck, CircleX, ClipboardCheck, Dumbbell, LoaderCircle, Lock, Trophy, CircleAlert, Cloud } from "lucide-react";
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
interface Selesai {
  sesi: Sesi;
  tercatat: boolean;
  ok: boolean;
  antre?: boolean;
  alasan?: string;
}
const HURUF = ["A", "B", "C", "D"];
const NAMA: Record<Mode, string> = { pre: "Pre-test", post: "Post-test", latihan: "Latihan" };

export default function KuisScreen({ cfg }: { cfg: AppConfig }) {
  const [bank, setBank] = useState<{ versi: string; soal: Soal[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [selesai, setSelesai] = useState<Selesai | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    loadKuis().then(setBank).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="pesan"><span className="ikon-bulat"><CircleAlert size={30} aria-hidden="true" /></span><h2>Kuis gagal dimuat</h2><p>{err}</p></div>;
  if (!bank) return <p className="muted pad">Memuat soal...</p>;

  async function mulai(mode: Mode) {
    const n = cfg.kuis.soalPerSesi;
    const soal = mode === "latihan" ? pilihSoal(bank!.soal, "semua", n) : pilihSoal(bank!.soal, await setUntuk(mode), n);
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
    if (final.mode === "latihan") {
      setSelesai({ sesi: final, tercatat: false, ok: false });
      return;
    }
    setMenyimpan(true);
    const catat: JawabanCatat[] = final.soal.map((s, k) => ({ id: s.id, pilih: final.jawab[k], benar: final.jawab[k] === s.benar }));
    const r = await simpanKuis(final.mode, catat, bank!.versi);
    track("quiz_complete", { tipe: final.mode, skor: catat.filter((c) => c.benar).length });
    setMenyimpan(false);
    setSelesai({ sesi: final, tercatat: true, ok: r.ok, antre: r.antre, alasan: r.alasan });
  }

  if (menyimpan) return <p className="muted pad"><LoaderCircle className="putar" size={18} aria-hidden="true" style={{ verticalAlign: "-4px" }} /> Menyimpan hasil...</p>;

  if (sesi) {
    const s = sesi.soal[sesi.idx];
    const persen = (sesi.idx / sesi.soal.length) * 100;
    return (
      <div className="kuis">
        <p className="muted">{NAMA[sesi.mode]} · Soal {sesi.idx + 1} dari {sesi.soal.length}</p>
        <div className="progres" role="progressbar" aria-valuenow={sesi.idx} aria-valuemin={0} aria-valuemax={sesi.soal.length}><div style={{ width: `${persen}%` }} /></div>
        <h2>{s.tanya}</h2>
        <div className="opsi">
          {s.opsi.map((o, i) => (
            <button key={i} className="btn opsi-btn" onClick={() => pilih(i)}>
              <span className="huruf">{HURUF[i]}</span>{o}
            </button>
          ))}
        </div>
        <p className="catatan">Penjelasan jawaban muncul setelah kuis selesai.</p>
      </div>
    );
  }

  if (selesai) {
    const { sesi: s } = selesai;
    const benar = s.soal.filter((q, k) => s.jawab[k] === q.benar).length;
    const rasio = benar / s.soal.length;
    const sapa = rasio === 1 ? "Sempurna! Kamu sudah jago memilah." : rasio >= 0.7 ? "Bagus! Tinggal sedikit lagi." : "Tidak apa-apa, baca penjelasannya di bawah dan coba lagi nanti.";
    return (
      <div className="kuis">
        <div className="skor">
          <Trophy size={40} color="var(--brand-strong)" aria-hidden="true" />
          <div>
            <p className="angka">{benar}/{s.soal.length}</p>
            <p>{sapa}</p>
          </div>
        </div>
        {selesai.tercatat && selesai.ok && !selesai.antre && <p className="ok-text"><CircleCheck size={18} aria-hidden="true" />Hasil tercatat secara anonim.</p>}
        {selesai.tercatat && selesai.antre && <p className="ok-text"><Cloud size={18} aria-hidden="true" />Koneksi lambat. Hasil akan tercatat otomatis begitu online, jangan tutup halaman dulu.</p>}
        {selesai.tercatat && !selesai.ok && (
          <p className="err-text" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>Hasil belum tercatat di server. {selesai.alasan} Kamu bisa mengulang tes ini nanti.</span></p>
        )}
        <ol className="review">
          {s.soal.map((q, k) => {
            const ok = s.jawab[k] === q.benar;
            return (
              <li key={q.id} className={ok ? "benar" : "salah"}>
                <strong>{q.tanya}</strong>
                <p className="hasil-baris" style={{ color: ok ? "var(--ok)" : "var(--err)" }}>
                  {ok ? <CircleCheck size={18} aria-hidden="true" /> : <CircleX size={18} aria-hidden="true" />}
                  {ok ? "Benar" : "Kurang tepat"}: {q.opsi[q.benar]}
                </p>
                <p className="muted">{q.penjelasan}</p>
              </li>
            );
          })}
        </ol>
        <button className="btn" onClick={() => setSelesai(null)}>Selesai</button>
      </div>
    );
  }

  const post = postTerbuka(cfg);
  const pre = infoKuis("pre");
  const postInfo = infoKuis("post");
  return (
    <div className="kuis">
      <h2>Kuis pemilahan sampah</h2>
      <p className="muted">Terpisah dari scan. Pre-test dan post-test mengukur apa yang kamu pelajari, hasilnya anonim.</p>
      <div className="menu-kuis">
        <section className="menu-item">
          <span className="ikon-bulat"><ClipboardCheck size={24} aria-hidden="true" /></span>
          <h3>Pre-test</h3>
          {kuisSelesai("pre") ? (
            <p className="ok-text"><CircleCheck size={18} aria-hidden="true" />Selesai: {pre?.skor}/{pre?.total}</p>
          ) : (
            <>
              <p>Sebelum mulai memakai aplikasi. Boleh dilewati.</p>
              <button className="btn" onClick={() => mulai("pre")}>Mulai pre-test</button>
            </>
          )}
        </section>
        <section className="menu-item">
          <span className="ikon-bulat"><Trophy size={24} aria-hidden="true" /></span>
          <h3>Post-test</h3>
          {kuisSelesai("post") ? (
            <p className="ok-text"><CircleCheck size={18} aria-hidden="true" />Selesai: {postInfo?.skor}/{postInfo?.total}</p>
          ) : post.terbuka ? (
            <>
              <p>Saatnya melihat kemajuanmu.</p>
              <button className="btn" onClick={() => mulai("post")}>Mulai post-test</button>
            </>
          ) : (
            <p className="muted"><Lock size={15} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {post.alasan}</p>
          )}
        </section>
        <section className="menu-item">
          <span className="ikon-bulat"><Dumbbell size={24} aria-hidden="true" /></span>
          <h3>Latihan</h3>
          <p>Soal acak, tidak dicatat, boleh diulang kapan saja.</p>
          <button className="btn ghost" onClick={() => mulai("latihan")}>Mulai latihan</button>
        </section>
      </div>
    </div>
  );
}
