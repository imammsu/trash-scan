import { useEffect, useMemo, useRef, useState } from "react";
import { Flag, Lightbulb, ListChecks, MapPin, RotateCcw, SearchX, ShieldAlert, TriangleAlert, Info, ChartColumn, CircleCheck } from "lucide-react";
import type { AppConfig, Detection, HasilScan, Kelas } from "../lib/types";
import { feedbackTerkirim } from "../lib/state";
import { IKON_KELAS, namaPendek, teksDi } from "../lib/kelasUi";
import FeedbackSheet from "./FeedbackSheet";

export interface HasilTampil {
  id: string;
  canvas: HTMLCanvasElement;
  hasil: HasilScan;
  deteksi: Detection[];
}

interface Props {
  cfg: AppConfig;
  data: HasilTampil;
  onUlang: () => void;
  onCariSetor: (k: Kelas) => void;
}

export default function ResultView({ cfg, data, onUlang, onCariSetor }: Props) {
  const { canvas, hasil, deteksi } = data;
  const [terpilih, setTerpilih] = useState<Kelas | null>(null);
  const [fb, setFb] = useState<Kelas | null>(null);
  const [, paksa] = useState(0);
  const kartuRef = useRef<Record<string, HTMLElement | null>>({});
  const gambar = useMemo(() => canvas.toDataURL("image/jpeg", 0.85), [canvas]);

  useEffect(() => {
    if (terpilih) kartuRef.current[terpilih]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [terpilih]);

  const grup = useMemo(() => {
    const m = new Map<Kelas, Detection[]>();
    for (const d of deteksi) m.set(d.kelas, [...(m.get(d.kelas) ?? []), d]);
    return [...m.entries()].sort((a, b) => b[1][0].score - a[1][0].score);
  }, [deteksi]);

  const ratio = `${canvas.width} / ${canvas.height}`;

  return (
    <div className="hasil-grid">
      <div className="foto-col">
        <div className="foto" style={{ aspectRatio: ratio }}>
          <img src={gambar} alt="Foto yang dipindai" className={hasil === "ok" ? "" : "redup"} />
          {hasil === "ok" &&
            deteksi.map((d, i) => {
              const w = cfg.kelasDetail[d.kelas].tong.warna;
              const Ikon = IKON_KELAS[d.kelas];
              return (
                <button
                  key={i}
                  className={"kotak" + (terpilih === d.kelas ? " aktif" : "")}
                  style={{
                    left: `${(d.x / canvas.width) * 100}%`,
                    top: `${(d.y / canvas.height) * 100}%`,
                    width: `${(d.w / canvas.width) * 100}%`,
                    height: `${(d.h / canvas.height) * 100}%`,
                    borderColor: w,
                  }}
                  onClick={() => setTerpilih(d.kelas)}
                  aria-label={`Sorot kartu ${cfg.kelasDetail[d.kelas].nama}`}
                >
                  <span style={{ background: w, color: teksDi(w) }}>
                    <Ikon size={13} aria-hidden="true" />
                    {namaPendek(cfg.kelasDetail[d.kelas].nama)}
                  </span>
                </button>
              );
            })}
        </div>
        <div className="row">
          <button className="btn besar" onClick={onUlang}>
            <RotateCcw size={20} aria-hidden="true" /> Scan lagi
          </button>
        </div>
      </div>

      <div className="kartu-col">
        {hasil === "kosong" && (
          <section className="pesan">
            <span className="ikon-bulat"><SearchX size={30} aria-hidden="true" /></span>
            <h2>Belum ada sampah yang terlihat</h2>
            <p>Dekatkan benda ke kamera, pastikan cahayanya cukup, lalu coba lagi.</p>
          </section>
        )}

        {hasil === "ragu" && (
          <section className="pesan">
            <span className="ikon-bulat"><ShieldAlert size={30} aria-hidden="true" /></span>
            <h2>Hmm, aku kurang yakin</h2>
            <p>Coba dari sudut lain atau dekatkan sedikit. Kamu juga bisa mencari namanya di Kamus. Panduan sengaja tidak ditampilkan supaya tidak keliru.</p>
          </section>
        )}

        {hasil === "ok" && <Ringkasan cfg={cfg} grup={grup} total={deteksi.length} />}

        {hasil === "ok" &&
          grup.map(([k, ds]) => {
            const det = cfg.kelasDetail[k];
            const e = det.edukasi;
            const Ikon = IKON_KELAS[k];
            const w = det.tong.warna;
            const sudah = feedbackTerkirim(data.id + k);
            return (
              <article
                key={k}
                ref={(el) => {
                  kartuRef.current[k] = el;
                }}
                className={"kartu" + (terpilih === k ? " aktif" : "")}
              >
                <header className="kartu-kepala" style={{ background: w, color: teksDi(w) }}>
                  <span className="lencana"><Ikon size={26} aria-hidden="true" /></span>
                  <div>
                    <h3>{det.nama}</h3>
                    <p>{det.tong.label}{ds.length > 1 ? `, ${ds.length} objek` : ""}</p>
                  </div>
                </header>
                <div className="kartu-isi">
                  {det.peringatan && (
                    <div className="peringatan" role="alert">
                      <TriangleAlert size={22} aria-hidden="true" color="var(--err)" />
                      <p><strong>Penting.</strong> {det.peringatan}</p>
                    </div>
                  )}
                  <h4><ListChecks size={18} aria-hidden="true" /> Cara membuang</h4>
                  <ol>{det.panduan.map((p, i) => <li key={i}>{p}</li>)}</ol>
                  <h4><Info size={18} aria-hidden="true" /> Kenapa penting</h4>
                  <p>{e.apa} {e.kenapa}</p>
                  {e.waktuTerurai && <p><strong>Waktu terurai:</strong> {e.waktuTerurai}</p>}
                  {e.fakta && (
                    <p className="fakta">
                      <ChartColumn size={16} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {e.fakta.teks}{" "}
                      <span className="muted">Sumber: {e.fakta.sumber}.</span>
                    </p>
                  )}
                  <div className="aksi-kecil">
                    <Lightbulb size={22} aria-hidden="true" color="var(--brand-strong)" />
                    <div>
                      <p><strong>Aksi kecil hari ini:</strong> {e.aksiKecil}</p>
                      <p className="muted">{e.kurangiDulu}</p>
                    </div>
                  </div>
                  <p>{e.sdg.map((s) => <span key={s} className="pil-sdg">{s}</span>)}</p>
                  <div className="row wrap">
                    {det.titikSetor && (
                      <button className="btn" onClick={() => onCariSetor(k)}>
                        <MapPin size={18} aria-hidden="true" /> Cari tempat setor
                      </button>
                    )}
                    <button className="btn ghost" disabled={sudah} onClick={() => setFb(k)}>
                      {sudah ? <CircleCheck size={18} aria-hidden="true" /> : <Flag size={18} aria-hidden="true" />}
                      {sudah ? "Koreksi terkirim" : "Klasifikasi salah?"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

        {hasil === "ok" && (
          <p className="catatan">
            Model bisa keliru. Untuk B3 dan benda yang meragukan, cek pedoman resmi atau tanya petugas bank sampah setempat.
          </p>
        )}
      </div>

      {fb && (
        <FeedbackSheet
          cfg={cfg}
          predicted={fb}
          deteksi={grup.find(([k]) => k === fb)![1][0]}
          canvas={canvas}
          feedbackKey={data.id + fb}
          onClose={() => setFb(null)}
          onSent={() => paksa((n) => n + 1)}
        />
      )}
    </div>
  );
}

function Ringkasan({ cfg, grup, total }: { cfg: AppConfig; grup: [Kelas, Detection[]][]; total: number }) {
  const dominan = [...grup].sort((a, b) => b[1].length - a[1].length || b[1][0].score - a[1][0].score)[0][0];
  const det = cfg.kelasDetail[dominan];
  const Ikon = IKON_KELAS[dominan];
  const w = det.tong.warna;
  const rincian = grup.map(([k, ds]) => `${ds.length} ${k === "b3" ? "B3" : k}`).join(", ");
  return (
    <section className="ringkasan" style={{ background: w, color: teksDi(w) }}>
      <span className="lencana"><Ikon size={32} aria-hidden="true" /></span>
      <div>
        <p className="sub">{total} objek terdeteksi: {rincian}</p>
        <h2>{det.nama}</h2>
        <p>{det.tong.label}</p>
        <p className="sub">{det.panduan[0]}</p>
      </div>
    </section>
  );
}
