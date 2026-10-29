import { useCallback, useEffect, useRef, useState } from "react";
import type { Detector } from "../lib/detector.ts";
import { minThreshold, type AppConfig } from "../lib/config.ts";
import { decideCapture, filterLive, type Outcome } from "../lib/decision.ts";
import { drawDetections } from "../lib/overlay.ts";
import { ResultPanel } from "./ResultPanel.tsx";
import { ErrorScreen } from "./Screens.tsx";

type Mode = "starting" | "live" | "analyzing" | "result" | "denied" | "camera-error";

interface Props {
  detector: Detector;
  config: AppConfig;
}

export function Scanner({ detector, config }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const frozenRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("starting");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);

  // --- Kamera (FR-01) ---
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setMode("live");
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setMode("denied");
        } else {
          setErrorMsg(name === "NotFoundError" ? "Kamera tidak ditemukan di perangkat ini." : "Kamera tidak bisa dibuka.");
          setMode("camera-error");
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [attempt]);

  // --- Loop deteksi live (FR-02), berkala agar HP tidak terbebani ---
  useEffect(() => {
    if (mode !== "live") return;
    let stopped = false;
    let busy = false;
    let last = 0;
    let raf = 0;
    const minScore = minThreshold(config, "live");

    const tick = async (t: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (busy || t - last < config.liveIntervalMs || !video || !overlay) return;
      if (video.readyState < 2 || !video.videoWidth) return;

      busy = true;
      last = t;
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        const dets = await detector.detect(video, w, h, {
          minScore,
          nmsIou: config.thresholds.nmsIou,
          maxDetections: config.thresholds.maxDetections,
        });
        if (stopped) return;
        if (overlay.width !== w || overlay.height !== h) {
          overlay.width = w;
          overlay.height = h;
        }
        const ctx = overlay.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        drawDetections(ctx, filterLive(dets, config), config, w, h);
      } catch (e) {
        console.error("Deteksi live gagal:", e);
      } finally {
        busy = false;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [mode, detector, config]);

  // --- Jepret (FR-03, FR-04, FR-07, FR-08) ---
  const capture = useCallback(async () => {
    const video = videoRef.current;
    const frozen = frozenRef.current;
    if (!video || !frozen || !video.videoWidth) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    frozen.width = w;
    frozen.height = h;
    const ctx = frozen.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h); // bekukan frame
    video.pause();
    setMode("analyzing");

    try {
      const dets = await detector.detect(frozen, w, h, {
        minScore: minThreshold(config, "floor"),
        nmsIou: config.thresholds.nmsIou,
        maxDetections: config.thresholds.maxDetections,
      });
      const result = decideCapture(dets, config);
      if (result.kind === "ok") drawDetections(ctx, result.detections, config, w, h);
      setOutcome(result);
      setMode("result");
    } catch (e) {
      console.error("Deteksi saat jepret gagal:", e);
      setErrorMsg("Terjadi masalah saat menganalisis gambar. Coba scan lagi.");
      setMode("camera-error");
    }
  }, [detector, config]);

  // --- Scan lagi (FR-09) ---
  const rescan = useCallback(async () => {
    setOutcome(null);
    try {
      await videoRef.current?.play();
      setMode("live");
    } catch {
      setAttempt((a) => a + 1); // stream mati: mulai ulang kamera
      setMode("starting");
    }
  }, []);

  if (mode === "denied") {
    return (
      <ErrorScreen
        title="Izin kamera diperlukan"
        message="TrashScan butuh kamera untuk mengenali sampah. Aktifkan izin kamera untuk situs ini lewat pengaturan browser (ikon gembok di address bar), lalu coba lagi. Gambar diproses di perangkatmu dan tidak dikirim ke mana pun."
        onRetry={() => {
          setMode("starting");
          setAttempt((a) => a + 1);
        }}
      />
    );
  }
  if (mode === "camera-error") {
    return (
      <ErrorScreen
        title="Kamera bermasalah"
        message={errorMsg}
        onRetry={() => {
          setOutcome(null);
          setMode("starting");
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  const showFrozen = mode === "analyzing" || mode === "result";

  return (
    <main className="scanner">
      <div className="viewport">
        <video ref={videoRef} playsInline muted autoPlay className={showFrozen ? "hidden" : ""} />
        <canvas ref={overlayRef} className={mode === "live" ? "overlay" : "overlay hidden"} />
        <canvas ref={frozenRef} className={showFrozen ? "frozen" : "frozen hidden"} />
        {mode === "starting" && <div className="hint">Membuka kamera…</div>}
        {mode === "analyzing" && <div className="hint">Menganalisis…</div>}
      </div>

      {mode === "result" && outcome ? (
        <ResultPanel outcome={outcome} config={config} onRescan={rescan} />
      ) : (
        <div className="controls">
          <button type="button" className="shutter" onClick={capture} disabled={mode !== "live"} aria-label="Jepret">
            <span />
          </button>
        </div>
      )}
    </main>
  );
}
