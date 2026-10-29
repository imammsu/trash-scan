import { useEffect, useMemo, useRef, useState } from "react";
import type { AppConfig, Detection, HasilScan, Kelas } from "../lib/types";
import { feedbackTerkirim } from "../lib/state";
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
    <div className="hasil">
      <div className="foto" style={{ aspectRatio: ratio }}>
        <img src={gambar} alt="Foto yang dipindai" className={hasil === "ok" ? "" : "redup"} />
        {hasil === "ok" &&
          deteksi.map((d, i) => (
            <button
              key={i}
              className={"kotak" + (terpilih === d.kelas ? " aktif" : "")}
              style={{
                left: `${(d.x / canvas.width) * 100}%`,
                top: `${(d.y / canvas.height) * 100}%`,
                width: `${(d.w / canvas.width) * 100}%`,
                height: `${(d.h / canvas.height) * 100}%`,
                borderColor: cfg.kelasDetail[d.kelas].tong.warna,
              }}
              onClick={() => setTerpilih(d.kelas)}
              aria-label={`Sorot kartu ${cfg.kelasDetail[d.kelas].nama}`}
            >
              <span style={{ background: cfg.kelasDetail[d.kelas].tong.warna }}>{cfg.kelasDetail[d.kelas].nama.replace("Sampah ", "")}</span>
            </button>
          ))}
      </div>

      {hasil === "kosong" && (
        <section className="pesan">
          <h2>Tidak ada sampah terdeteksi</h2>
          <p>Dekatkan benda ke kamera, pastikan cahaya cukup, lalu coba lagi.</p>
          <button className="btn" onClick={onUlang}>Scan lagi</button>
        </section>
      )}

      {hasil === "ragu" && (
        <section className="pesan">
          <h2>Tidak yakin, coba dari sudut lain</h2>
          <p>Model belum cukup yakin, jadi panduan tidak ditampilkan agar tidak keliru. Coba dekatkan, ganti sudut, atau cari namanya di Kamus.</p>
          <button className="btn" onClick={onUlang}>Scan lagi</button>
        </section>
      )}

      {hasil === "ok" && <Ringkasan cfg={cfg} grup={grup} total={deteksi.length} />}

      {hasil === "ok" &&
        grup.map(([k, ds]) => {
          const det = cfg.kelasDetail[k];
          const e = det.edukasi;
          const sudah = feedbackTerkirim(data.id + k);
          return (
            <article
              key={k}
              ref={(el) => {
                kartuRef.current[k] = el;
              }}
              className={"kartu" + (terpilih === k ? " aktif" : "")}
              style={{ borderLeftColor: det.tong.warna }}
            >
              <header>
                <h3>{det.nama}</h3>
                <p className="tong">{det.tong.label}{ds.length > 1 ? `, ${ds.length} objek` : ""}</p>
              </header>
              {det.peringatan && <p className="peringatan" role="alert"><strong>Peringatan.</strong> {det.peringatan}</p>}
              <h4>Cara membuang</h4>
              <ol>{det.panduan.map((p, i) => <li key={i}>{p}</li>)}</ol>
              <h4>Kenapa penting</h4>
              <p>{e.apa} {e.kenapa}</p>
              {e.waktuTerurai && <p><strong>Waktu terurai:</strong> {e.waktuTerurai}</p>}
              {e.fakta && <p className="fakta">{e.fakta.teks} <span className="muted">Sumber: {e.fakta.sumber}.</span></p>}
              <div className="aksi-kecil">
                <strong>Aksi kecil:</strong> {e.aksiKecil}
                <br />
                <span>{e.kurangiDulu}</span>
              </div>
              <p className="sdg">{e.sdg.join(", ")}</p>
              <div className="row wrap">
                {det.titikSetor && <button className="btn" onClick={() => onCariSetor(k)}>Cari tempat setor</button>}
                <button
                  className="btn ghost"
                  disabled={sudah}
                  onClick={() => setFb(k)}
                >
                  {sudah ? "Koreksi terkirim" : "Klasifikasi salah?"}
                </button>
              </div>
            </article>
          );
        })}

      {hasil === "ok" && (
        <>
          <p className="catatan">
            Model bisa keliru. Untuk B3 dan benda yang meragukan, cek pedoman resmi atau tanya petugas bank sampah setempat.
          </p>
          <button className="btn besar" onClick={onUlang}>Scan lagi</button>
        </>
      )}

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
  const rincian = grup.map(([k, ds]) => `${ds.length} ${k === "b3" ? "B3" : k}`).join(", ");
  return (
    <section className="ringkasan" style={{ borderTopColor: det.tong.warna }}>
      <p className="muted">{total} objek terdeteksi: {rincian}</p>
      <h2>{det.nama}</h2>
      <p className="tong">{det.tong.label}</p>
      <p>{det.panduan[0]}</p>
      <p><strong>Aksi kecil:</strong> {det.edukasi.aksiKecil}</p>
    </section>
  );
}
