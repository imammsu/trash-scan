import { useEffect, useState, type CSSProperties } from "react";
import Icon from "../components/Icon";
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

interface HasilKuis {
  sesi: Sesi;
  ok: boolean;
  sumber: "server" | "lokal" | "tidak";
  alasan?: string;
  tercatat: boolean;
  jawabanCatat?: JawabanCatat[];
}

export default function KuisScreen({ cfg }: { cfg: AppConfig }) {
  const [bank, setBank] = useState<{ versi: string; soal: Soal[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [selesai, setSelesai] = useState<HasilKuis | null>(null);
  const [mengirimUlang, setMengirimUlang] = useState(false);
  const [, paksa] = useState(0);

  useEffect(() => {
    loadKuis().then(setBank).catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="card state-card err">
        <div className="badge-ikon"><Icon name="error" size={28} /></div>
        <h2>Kuis gagal dimuat</h2>
        <p>{err}</p>
      </div>
    );
  }
  if (!bank) return <div className="card lega"><p className="muted">Memuat soal...</p></div>;

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
      track("quiz_complete", {
        tipe: final.mode,
        skor: catat.filter((c) => c.benar).length,
        tersimpan: r.sumber === "server" ? "ya" : "tidak",
      });
      setSelesai({ sesi: final, ok, sumber: r.sumber, alasan, tercatat: true, jawabanCatat: catat });
    } else {
      setSelesai({ sesi: final, ok, sumber: "lokal", tercatat: false });
    }
    paksa((n) => n + 1);
  }

  async function cobaSimpanUlang() {
    if (!selesai?.jawabanCatat || selesai.sesi.mode === "latihan" || mengirimUlang) return;
    setMengirimUlang(true);
    const r = await simpanKuis(selesai.sesi.mode, selesai.jawabanCatat, bank!.versi);
    setSelesai({ ...selesai, ok: r.ok, sumber: r.sumber, alasan: r.alasan });
    setMengirimUlang(false);
  }

  // --- sedang mengerjakan ---
  if (sesi) {
    const s = sesi.soal[sesi.idx];
    const persen = Math.round(((sesi.idx + 1) / sesi.soal.length) * 100);
    return (
      <div className="stack">
        <div className="kuis-progress">
          <div className="row">
            <span className="label muted">
              {sesi.mode === "latihan" ? "Latihan" : sesi.mode === "pre" ? "Pre-test" : "Post-test"} · Soal {sesi.idx + 1} dari {sesi.soal.length}
            </span>
            <span className="label-sm muted">{persen}%</span>
          </div>
          <div className="bar" role="progressbar" aria-valuenow={sesi.idx + 1} aria-valuemin={1} aria-valuemax={sesi.soal.length}>
            <div style={{ width: `${persen}%` }} />
          </div>
        </div>

        <div className="card lega soal">
          <h2>{s.tanya}</h2>
        </div>

        <div className="opsi">
          {s.opsi.map((o, i) => (
            <button key={i} className="opsi-btn" onClick={() => pilih(i)}>
              <span className="huruf">{String.fromCharCode(65 + i)}</span>
              <span>{o}</span>
            </button>
          ))}
        </div>

        <p className="catatan">
          <Icon name="info" size={16} />
          <span>Penjelasan jawaban muncul setelah kuis selesai.</span>
        </p>
      </div>
    );
  }

  // --- hasil ---
  if (selesai) {
    const { sesi: s } = selesai;
    const benar = s.soal.filter((q, k) => s.jawab[k] === q.benar).length;
    const persen = Math.round((benar / s.soal.length) * 100);
    return (
      <div className="stack">
        <div className="card lega skor-card">
          <div className="cincin" style={{ "--p": persen } as CSSProperties}>
            <div>
              <strong>{benar}/{s.soal.length}</strong>
              <span>Benar</span>
            </div>
          </div>
          <div className="stack-sm">
            <h2>Skor kamu {benar} dari {s.soal.length}</h2>
            {selesai.tercatat && selesai.ok && <p className="ok-text">Hasil tercatat secara anonim di Firebase.</p>}
            {selesai.tercatat && !selesai.ok && selesai.sumber === "lokal" && (
              <p className="err-text" role="alert">Firebase belum aktif. Skor tersimpan hanya di perangkat ini.</p>
            )}
            {selesai.tercatat && !selesai.ok && selesai.sumber === "tidak" && (
              <p className="err-text" role="alert">
                Hasil belum tercatat di server. {selesai.alasan}
              </p>
            )}
            {selesai.tercatat && !selesai.ok && selesai.sumber === "tidak" && (
              <button className="btn tonal kecil" onClick={() => void cobaSimpanUlang()} disabled={mengirimUlang}>
                <Icon name="refresh" size={18} />{mengirimUlang ? "Mengirim ulang..." : "Coba kirim lagi"}
              </button>
            )}
          </div>
        </div>

        <ol className="review">
          {s.soal.map((q, k) => {
            const ok = s.jawab[k] === q.benar;
            return (
              <li key={q.id} className="card">
                <strong>{k + 1}. {q.tanya}</strong>
                <div className={"hasil-pil " + (ok ? "benar" : "salah")}>
                  <Icon name={ok ? "check_circle" : "cancel"} size={18} fill />
                  <span>{ok ? "Benar" : "Kurang tepat"}. Jawaban: {q.opsi[q.benar]}</span>
                </div>
                <p className="penjelasan">{q.penjelasan}</p>
              </li>
            );
          })}
        </ol>

        <button className="btn besar penuh" onClick={() => setSelesai(null)}>
          <Icon name="check" size={20} />Selesai
        </button>
      </div>
    );
  }

  // --- menu ---
  const post = postTerbuka(cfg);
  const pre = infoKuis("pre");
  const postInfo = infoKuis("post");
  const preSelesai = kuisSelesai("pre");
  const postSudah = kuisSelesai("post");

  return (
    <div className="stack">
      <div className="judul-layar">
        <h2>Kuis pemilahan sampah</h2>
        <p className="muted">Kuis terpisah dari scan. Pre-test dan post-test mengukur apa yang kamu pelajari, hasilnya anonim.</p>
      </div>

      <section className={"card lega menu-card" + (!preSelesai ? " sorot" : "")}>
        <div className="card-head">
          <div className="badge-ikon"><Icon name={preSelesai ? "task_alt" : "flag"} size={22} /></div>
          <div className="grow">
            <h3>Pre-test</h3>
          </div>
          {preSelesai && (
            <span className="status-pil"><Icon name="check_circle" size={14} fill />Selesai</span>
          )}
        </div>
        {preSelesai ? (
          <p className="muted">
            Selesai: skor {pre?.skor} dari {pre?.total}. {pre?.sumber === "server" ? "Tersimpan di Firebase." : "Tersimpan lokal; belum masuk Firebase."}
          </p>
        ) : (
          <>
            <p className="muted">Kerjakan sebelum mulai memakai aplikasi. Boleh dilewati.</p>
            <button className="btn penuh" onClick={() => mulai("pre")}>
              <Icon name="play_arrow" size={20} fill />Mulai pre-test
            </button>
          </>
        )}
      </section>

      <section className={"card lega menu-card" + (!postSudah && post.terbuka ? " sorot" : "")}>
        <div className="card-head">
          <div className="badge-ikon">
            <Icon name={postSudah ? "verified" : post.terbuka ? "emoji_events" : "lock"} size={22} />
          </div>
          <div className="grow">
            <h3>Post-test</h3>
          </div>
          {postSudah ? (
            <span className="status-pil"><Icon name="check_circle" size={14} fill />Selesai</span>
          ) : !post.terbuka ? (
            <span className="status-pil kunci"><Icon name="lock" size={14} />Terkunci</span>
          ) : null}
        </div>
        {postSudah ? (
          <p className="muted">
            Selesai: skor {postInfo?.skor} dari {postInfo?.total}. {postInfo?.sumber === "server" ? "Tersimpan di Firebase." : "Tersimpan lokal; belum masuk Firebase."}
          </p>
        ) : post.terbuka ? (
          <button className="btn penuh" onClick={() => mulai("post")}>
            <Icon name="play_arrow" size={20} fill />Mulai post-test
          </button>
        ) : (
          <p className="muted">{post.alasan}</p>
        )}
      </section>

      <section className="card lega menu-card">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="quiz" size={22} /></div>
          <div className="grow">
            <h3>Latihan</h3>
          </div>
        </div>
        <p className="muted">Soal acak dari seluruh bank. Tidak dicatat dan bisa diulang kapan saja.</p>
        <button className="btn tonal penuh" onClick={() => mulai("latihan")}>
          <Icon name="replay" size={18} />Mulai latihan
        </button>
      </section>
    </div>
  );
}
