import { useCallback, useEffect, useRef, useState } from "react";
import type { AppConfig, Kelas } from "../lib/types";
import { putuskan, saringLive } from "../lib/detector";
import { bekukanVideo, bitmapDariFile } from "../lib/image";
import { dukungan, type ModelState } from "../lib/useApp";
import { track } from "../lib/analytics";
import { jumlahScan, kuisSelesai, tambahScan } from "../lib/state";
import ResultView, { type HasilTampil } from "../components/ResultView";

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

  // Kamera dan loop deteksi live
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
          if (!stop) gambarOverlay(saringLive(dets, cfg.ambang));
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
      if (c.width !== Math.round(rect.width * dpr)) {
        c.width = Math.round(rect.width * dpr);
        c.height = Math.round(rect.height * dpr);
      }
      const k = c.width / v.videoWidth;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.lineWidth = 3 * dpr;
      ctx.font = `${600} ${14 * dpr}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      for (const d of dets) {
        const warna = cfg.kelasDetail[d.kelas].tong.warna;
        ctx.strokeStyle = warna;
        ctx.strokeRect(d.x * k, d.y * k, d.w * k, d.h * k);
        const teks = cfg.kelasDetail[d.kelas].nama.replace("Sampah ", "");
        const tw = ctx.measureText(teks).width + 12 * dpr;
        const th = 22 * dpr;
        const ty = Math.max(0, d.y * k - th);
        ctx.fillStyle = warna;
        ctx.fillRect(d.x * k, ty, tw, th);
        ctx.fillStyle = d.kelas === "anorganik" ? "#1a1a1a" : "#fff";
        ctx.fillText(teks, d.x * k + 6 * dpr, ty + th / 2);
      }
    }

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      setCamOn(false);
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
      <div className="pesan">
        <h2>Browser belum didukung</h2>
        <p>Buka TrashScan di Chrome atau Safari versi terbaru lewat HTTPS. Kamus dan Lokasi tetap bisa dipakai.</p>
      </div>
    );
  }

  if (model.status === "error") {
    return (
      <div className="pesan">
        <h2>Model gagal dimuat</h2>
        <p>{model.error}</p>
        <button className="btn" onClick={model.retry}>Coba lagi</button>
      </div>
    );
  }

  if (hasil) {
    return <ResultView cfg={cfg} data={hasil} onUlang={() => setHasil(null)} onCariSetor={onCariSetor} />;
  }

  const siap = model.status === "ready";
  const persen = model.progress >= 0 ? Math.round(model.progress * 100) : null;

  return (
    <div className="scan">
      {!kuisSelesai("pre") && jumlahScan() === 0 && (
        <button className="banner" onClick={onKuis}>
          Mau ikut pre-test singkat? Hasilnya anonim dan membantu mengukur belajar.
        </button>
      )}

      <div className="viewfinder">
        <video ref={videoRef} playsInline muted aria-label="Pratinjau kamera" />
        <canvas ref={overlayRef} className="overlay" aria-hidden="true" />
        {!camOn && !camErr && dk.kamera && <p className="vf-pesan">Membuka kamera...</p>}
        {(camErr || !dk.kamera) && (
          <div className="vf-pesan">
            <p>{camErr ?? "Kamera butuh koneksi HTTPS dan browser yang didukung. Unggah foto sebagai gantinya."}</p>
          </div>
        )}
      </div>

      {model.status === "loading" && (
        <div className="muat" role="status">
          <div className="bar" aria-hidden="true">
            <div style={{ width: persen === null ? "40%" : `${persen}%` }} className={persen === null ? "indet" : ""} />
          </div>
          <p>Memuat model deteksi{persen !== null ? ` ${persen}%` : ""}</p>
          <p className="muted">{cfg.faktaMuat[fakta]}</p>
        </div>
      )}

      {pesan && <p className="err-text" role="alert">{pesan}</p>}

      <div className="kontrol">
        <button className="btn besar" disabled={!siap || !camOn || memproses} onClick={jepret}>
          {memproses ? "Memproses..." : "Jepret"}
        </button>
        <button className="btn ghost besar" disabled={!siap || memproses} onClick={() => fileRef.current?.click()}>
          Unggah foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
      <p className="catatan">Arahkan kamera ke satu benda. Kotak dan label muncul saat model mengenali sampahnya.</p>
    </div>
  );
}
