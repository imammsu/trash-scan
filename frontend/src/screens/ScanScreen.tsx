import { useCallback, useEffect, useRef, useState } from "react";
import type { AppConfig, Detection, Kelas } from "../lib/types";
import { putuskan, saringLive } from "../lib/detector";
import { bekukanVideo, bitmapDariFile } from "../lib/image";
import { dukungan, type ModelState } from "../lib/useApp";
import { track } from "../lib/analytics";
import { jumlahScan, kuisSelesai, tambahScan } from "../lib/state";
import { IKON_KELAS, namaPendek, teksDiAtas, varKelas } from "../lib/kelasUi";
import ResultView, { type HasilTampil } from "../components/ResultView";
import Icon from "../components/Icon";

interface Props {
  cfg: AppConfig;
  model: ModelState;
  onCariSetor: (k: Kelas) => void;
  onKuis: () => void;
}

export default function ScanScreen({ cfg, model, onCariSetor, onKuis }: Props) {
  const [hasil, setHasil] = useState<HasilTampil | null>(null);
  const [memproses, setMemproses] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [liveDets, setLiveDets] = useState<Detection[]>([]);
  const [fakta, setFakta] = useState(0);
  const [pesan, setPesan] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const detectorRef = useRef(model.detector);
  useEffect(() => {
    detectorRef.current = model.detector;
  }, [model.detector]);
  const dk = dukungan();

  // Fakta singkat selama model dimuat (FR-12)
  useEffect(() => {
    if (model.status !== "loading") return;
    const t = setInterval(() => setFakta((f) => (f + 1) % cfg.faktaMuat.length), 4000);
    return () => clearInterval(t);
  }, [model.status, cfg.faktaMuat.length]);

  // Kamera belakang dan loop deteksi live
  useEffect(() => {
    if (hasil || !dk.kamera || !dk.wasm) return;
    let stop = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let busy = false;
    let last = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
          audio: false,
        });
      } catch (e) {
        const nama = (e as DOMException)?.name;
        setCamErr(
          nama === "NotAllowedError"
            ? "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser, atau unggah foto."
            : "Kamera tidak bisa dibuka. Kamu bisa unggah foto sebagai gantinya.",
        );
        return;
      }
      if (stop) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const v = videoRef.current!;
      v.srcObject = stream;
      try {
        await v.play();
      } catch {
        /* autoplay dicegah, pengguna masih bisa ketuk */
      }
      setCamErr(null);
      setCamOn(true);

      const tick = async (t: number) => {
        if (stop) return;
        raf = requestAnimationFrame(tick);
        const det = detectorRef.current;
        if (busy || !det || t - last < 150 || v.videoWidth === 0) return;
        busy = true;
        last = t;
        try {
          const dets = await det.detect(v, v.videoWidth, v.videoHeight);
          if (!stop) {
            const lolos = saringLive(dets, cfg.ambang);
            setLiveDets(lolos);
            gambarOverlay(lolos);
          }
        } catch (e) {
          console.warn(e);
        } finally {
          busy = false;
        }
      };
      raf = requestAnimationFrame(tick);
    })();

    function gambarOverlay(dets: ReturnType<typeof saringLive>) {
      const v = videoRef.current;
      const c = overlayRef.current;
      if (!v || !c || !v.videoWidth) return;
      const rect = v.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cw = Math.round(rect.width * dpr);
      const ch = Math.round(rect.height * dpr);
      if (c.width !== cw || c.height !== ch) {
        c.width = cw;
        c.height = ch;
      }
      // Penyesuaian koordinat untuk video object-fit: cover
      const scale = Math.max(cw / v.videoWidth, ch / v.videoHeight);
      const ox = (cw - v.videoWidth * scale) / 2;
      const oy = (ch - v.videoHeight * scale) / 2;

      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, cw, ch);
      ctx.lineWidth = 2.5 * dpr;
      ctx.font = `600 ${12 * dpr}px "Inter", "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      const rBox = 12 * dpr;
      for (const d of dets) {
        const warna = cfg.kelasDetail[d.kelas].tong.warna;
        const bx = d.x * scale + ox;
        const by = d.y * scale + oy;
        const bw = d.w * scale;
        const bh = d.h * scale;

        ctx.save();
        ctx.strokeStyle = warna;
        ctx.shadowColor = warna;
        ctx.shadowBlur = 12 * dpr;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, rBox);
        ctx.stroke();
        ctx.restore();

        const teks = namaPendek(cfg, d.kelas);
        const padX = 10 * dpr;
        const tw = ctx.measureText(teks).width + padX * 2;
        const th = 22 * dpr;
        const tx = Math.max(4 * dpr, Math.min(bx + 6 * dpr, cw - tw - 4 * dpr));
        const ty = Math.max(4 * dpr, by - th / 2);

        ctx.fillStyle = warna;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, th / 2);
        ctx.fill();

        ctx.fillStyle = teksDiAtas(d.kelas);
        ctx.fillText(teks, tx + padX, ty + th / 2 + 0.5 * dpr);
      }
    }

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      setCamOn(false);
      setLiveDets([]);
    };
  }, [hasil, dk.kamera, dk.wasm, cfg]);

  const proses = useCallback(
    async (canvas: HTMLCanvasElement, sumber: "kamera" | "upload") => {
      const det = detectorRef.current;
      if (!det) return;
      setMemproses(true);
      setPesan(null);
      try {
        const dets = await det.detect(canvas, canvas.width, canvas.height);
        const k = putuskan(dets, cfg.ambang);
        tambahScan();
        track("scan_result", {
          kelas: k.deteksi[0]?.kelas ?? "none",
          sumber,
          hasil: k.hasil,
        });
        setHasil({ id: `${Date.now()}`, canvas, hasil: k.hasil, deteksi: k.deteksi });
      } catch (e) {
        console.warn(e);
        setPesan(`Gagal memproses gambar: ${(e as Error)?.message ?? e}`);
      } finally {
        setMemproses(false);
      }
    },
    [cfg.ambang],
  );

  function jepret() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    void proses(bekukanVideo(v), "kamera");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      setMemproses(true);
      const c = await bitmapDariFile(f);
      await proses(c, "upload");
    } catch (err) {
      setMemproses(false);
      setPesan((err as Error).message);
    }
  }

  // ---- Tampilan ----
  if (!dk.wasm) {
    return (
      <div className="card state-card warn">
        <div className="badge-ikon"><Icon name="devices" size={28} /></div>
        <h2>Browser belum didukung</h2>
        <p>Buka TrashScan di Chrome atau Safari versi terbaru lewat HTTPS. Kamus dan Lokasi tetap bisa dipakai.</p>
      </div>
    );
  }

  if (model.status === "error") {
    return (
      <div className="card state-card err">
        <div className="badge-ikon"><Icon name="error" size={28} /></div>
        <h2>Model gagal dimuat</h2>
        <p>{model.error}</p>
        <button className="btn" onClick={model.retry}>
          <Icon name="refresh" />Coba lagi
        </button>
      </div>
    );
  }

  if (hasil) {
    return <ResultView cfg={cfg} data={hasil} onUlang={() => setHasil(null)} onCariSetor={onCariSetor} />;
  }

  const siap = model.status === "ready";
  const persen = model.progress >= 0 ? Math.round(model.progress * 100) : null;
  const bisaJepret = siap && camOn && !memproses;

  return (
    <div className="stack">
      {!kuisSelesai("pre") && jumlahScan() === 0 && (
        <button className="banner" onClick={onKuis}>
          <Icon name="quiz" size={22} />
          <span className="teks">Mau ikut pre-test singkat? Hasilnya anonim dan membantu mengukur belajar.</span>
          <Icon name="chevron_right" size={20} />
        </button>
      )}

      {/* Viewfinder Kamera */}
      <div className="viewfinder">
        <video ref={videoRef} playsInline muted aria-label="Pratinjau kamera" />
        <canvas ref={overlayRef} className="overlay" aria-hidden="true" />
        <div className="vf-sudut" aria-hidden="true"><i /><i /><i /><i /></div>

        {camOn && (
          <div className="vf-status">
            <span className="pulse" aria-hidden="true" />
            <span className="label-sm">
              {siap ? "Kamera Aktif • Arahkan ke sampah" : "Menyiapkan model deteksi..."}
            </span>
          </div>
        )}

        {!camOn && !camErr && dk.kamera && (
          <div className="vf-pesan">
            <Icon name="photo_camera" size={32} />
            <p>Membuka kamera...</p>
          </div>
        )}
        {(camErr || !dk.kamera) && (
          <div className="vf-pesan">
            <Icon name="no_photography" size={32} />
            <p>{camErr ?? "Kamera butuh koneksi HTTPS dan browser yang didukung. Unggah foto sebagai gantinya."}</p>
          </div>
        )}
      </div>

      {/* Area Kontrol Ergonomis: Unggah Foto — Jepret (Tanpa Kamera Depan) */}
      <div className="kontrol">
        <button
          type="button"
          className="galeri kiri"
          disabled={!siap || memproses}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="photo_library" size={20} />
          <span>Unggah foto</span>
        </button>

        <div className={"shutter-wrap" + (bisaJepret ? "" : " mati")}>
          <button
            type="button"
            className="shutter"
            disabled={!bisaJepret}
            onClick={jepret}
            aria-label={memproses ? "Memproses..." : "Jepret"}
          >
            {memproses ? <span className="spin" aria-hidden="true" /> : <Icon name="photo_camera" size={32} />}
          </button>
        </div>

        <div aria-hidden="true" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>

      {/* Status pemuatan model (FR-12) */}
      {model.status === "loading" && (
        <div className="card muat" role="status">
          <div className="muat-head">
            <div className="row">
              <Icon name="downloading" size={20} />
              <strong>Memuat model deteksi{persen !== null ? ` ${persen}%` : ""}</strong>
            </div>
          </div>
          <div className="bar" aria-hidden="true">
            <div style={{ width: persen === null ? "40%" : `${persen}%` }} className={persen === null ? "indet" : ""} />
          </div>
          <div className="fakta-box">
            <Icon name="lightbulb" size={18} />
            <p>{cfg.faktaMuat[fakta]}</p>
          </div>
        </div>
      )}

      {pesan && (
        <div className="alert" role="alert">
          <Icon name="error" size={20} />
          <span>{pesan}</span>
        </div>
      )}

      {/* Ringkasan deteksi live / petunjuk singkat */}
      <div className="card live-card">
        <div className="live-head">
          <div className="judul label">
            <Icon name="task_alt" size={18} />
            <span>
              {liveDets.length > 0
                ? `${liveDets.length} Objek Terdeteksi`
                : "Siap Memindai Sampah"}
            </span>
          </div>
          {liveDets.length > 0 && (
            <button type="button" className="btn teks kecil" onClick={jepret} disabled={!bisaJepret}>
              <Icon name="info" size={15} />
              <span>Lihat Panduan</span>
            </button>
          )}
        </div>

        {liveDets.length > 0 ? (
          <div className="live-grid">
            {liveDets.map((d, i) => (
              <div key={i} className="live-item" style={varKelas(cfg, d.kelas)}>
                <Icon name={IKON_KELAS[d.kelas]} size={18} />
                <span>{namaPendek(cfg, d.kelas)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="catatan">
            <Icon name="center_focus_strong" size={16} />
            <span>Arahkan kamera ke satu benda. Kotak dan label muncul saat model mengenali sampahnya.</span>
          </p>
        )}
      </div>
    </div>
  );
}
