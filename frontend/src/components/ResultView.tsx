import { useEffect, useMemo, useRef, useState } from "react";
import type { AppConfig, Detection, HasilScan, Kelas } from "../lib/types";
import { feedbackTerkirim } from "../lib/state";
import { IKON_KELAS, namaPendek, varKelas } from "../lib/kelasUi";
import FeedbackSheet from "./FeedbackSheet";
import Icon from "./Icon";

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
    <div className="stack">
      <div className="hasil-top">
        <h2>Hasil Pemindaian</h2>
        <button className="btn tonal kecil" onClick={onUlang}>
          <Icon name="replay" size={18} />
          <span>Scan lagi</span>
        </button>
      </div>

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
                ...varKelas(cfg, d.kelas),
              }}
              onClick={() => setTerpilih(d.kelas)}
              aria-label={`Sorot kartu ${cfg.kelasDetail[d.kelas].nama}`}
            >
              <span>
                <Icon name={IKON_KELAS[d.kelas]} size={13} />
                <span>{namaPendek(cfg, d.kelas)}</span>
              </span>
            </button>
          ))}
      </div>

      {hasil === "ok" && grup.length > 1 && (
        <p className="hint">
          <Icon name="touch_app" size={16} />
          <span>Ketuk kotak pada foto untuk menyorot kartu panduannya.</span>
        </p>
      )}

      {hasil === "kosong" && (
        <section className="card state-card">
          <div className="badge-ikon"><Icon name="search_off" size={28} /></div>
          <h2>Tidak ada sampah terdeteksi</h2>
          <p>Dekatkan benda ke kamera, pastikan cahaya cukup, lalu coba lagi.</p>
          <button className="btn" onClick={onUlang}>
            <Icon name="center_focus_strong" />
            <span>Scan lagi</span>
          </button>
        </section>
      )}

      {hasil === "ragu" && (
        <section className="card state-card warn">
          <div className="badge-ikon"><Icon name="help" size={28} /></div>
          <h2>Tidak yakin, coba dari sudut lain</h2>
          <p>Model belum cukup yakin, jadi panduan tidak ditampilkan agar tidak keliru. Coba dekatkan, ganti sudut, atau cari namanya di Kamus.</p>
          <button className="btn" onClick={onUlang}>
            <Icon name="center_focus_strong" />
            <span>Scan lagi</span>
          </button>
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
              className={"card lega kartu" + (terpilih === k ? " aktif" : "")}
              style={varKelas(cfg, k)}
            >
              <header className="kartu-head">
                <div className="badge-ikon kelas">
                  <Icon name={IKON_KELAS[k]} size={22} />
                </div>
                <div className="stack-sm">
                  <h3>{det.nama}</h3>
                  <p className="tong">
                    <i aria-hidden="true" />
                    <span>{det.tong.label}{ds.length > 1 ? ` • ${ds.length} objek` : ""}</span>
                  </p>
                </div>
              </header>

              {det.peringatan && (
                <div className="peringatan" role="alert">
                  <Icon name="warning" size={20} />
                  <p><strong>Peringatan.</strong> {det.peringatan}</p>
                </div>
              )}

              <div className="sub">
                <h4><Icon name="checklist" size={16} />Cara membuang</h4>
                <ol className="langkah">
                  {det.panduan.map((p, i) => <li key={i}>{p}</li>)}
                </ol>
              </div>

              <div className="sub stack-sm">
                <h4><Icon name="school" size={16} />Kenapa penting</h4>
                <p>{e.apa} {e.kenapa}</p>
                {e.waktuTerurai && (
                  <p className="label">
                    <Icon name="schedule" size={15} /> Waktu terurai: {e.waktuTerurai}
                  </p>
                )}
                {e.fakta && (
                  <p className="fakta">
                    {e.fakta.teks} <span className="muted">Sumber: {e.fakta.sumber}.</span>
                  </p>
                )}
              </div>

              <div className="aksi-kecil">
                <Icon name="eco" size={20} />
                <div>
                  <strong>Aksi kecil</strong>
                  <p>{e.aksiKecil} {e.kurangiDulu}</p>
                </div>
              </div>

              <div className="sdg-row" aria-label="Keterkaitan SDGs">
                {e.sdg.map((s) => (
                  <span key={s} className="sdg-pil">{s}</span>
                ))}
              </div>

              <div className="row wrap">
                {det.titikSetor && (
                  <button className="btn" onClick={() => onCariSetor(k)}>
                    <Icon name="pin_drop" size={18} />
                    <span>Cari tempat setor</span>
                  </button>
                )}
                <button
                  className="btn ghost"
                  disabled={sudah}
                  onClick={() => setFb(k)}
                >
                  <Icon name={sudah ? "check_circle" : "flag"} size={18} />
                  <span>{sudah ? "Koreksi terkirim" : "Klasifikasi salah?"}</span>
                </button>
              </div>
            </article>
          );
        })}

      {hasil === "ok" && (
        <>
          <p className="catatan">
            <Icon name="info" size={16} />
            <span>Model bisa keliru. Untuk B3 dan benda yang meragukan, cek pedoman resmi atau tanya petugas bank sampah setempat.</span>
          </p>
          <button className="btn besar penuh" onClick={onUlang}>
            <Icon name="center_focus_strong" size={22} />
            <span>Scan lagi</span>
          </button>
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
  return (
    <section className="card lega ringkasan" style={varKelas(cfg, dominan)}>
      <div className="row wrap" style={{ justifyContent: "space-between" }}>
        <span className="label muted">{total} objek terdeteksi</span>
        <div className="chips">
          {grup.map(([k, ds]) => (
            <span key={k} className="pil-kelas" style={varKelas(cfg, k)}>
              <Icon name={IKON_KELAS[k]} size={15} />
              <span>{ds.length}× {namaPendek(cfg, k)}</span>
            </span>
          ))}
        </div>
      </div>
      <h2>{det.nama}</h2>
      <p className="tong">
        <i aria-hidden="true" />
        <span>{det.tong.label}</span>
      </p>
      <p>{det.panduan[0]}</p>
      <div className="aksi-kecil">
        <Icon name="tips_and_updates" size={20} />
        <div>
          <strong>Aksi kecil</strong>
          <p>{det.edukasi.aksiKecil}</p>
        </div>
      </div>
    </section>
  );
}
