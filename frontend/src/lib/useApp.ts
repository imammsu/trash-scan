import { useCallback, useEffect, useState } from "react";
import { loadConfig } from "./content";
import { muatDetector, type Detector } from "./detector";
import type { AppConfig } from "./types";

export function useConfig() {
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadConfig().then(setCfg).catch((e) => setError(String(e.message ?? e)));
  }, []);
  return { cfg, error };
}

export interface ModelState {
  status: "loading" | "ready" | "error";
  progress: number; // 0..1, -1 = tidak diketahui
  detector: Detector | null;
  error: string | null;
  retry: () => void;
}

export function useDetector(cfg: AppConfig | null): ModelState {
  const [status, setStatus] = useState<ModelState["status"]>("loading");
  const [progress, setProgress] = useState(0);
  const [detector, setDetector] = useState<Detector | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!cfg) return;
    let batal = false;
    muatDetector(cfg, (p) => !batal && setProgress(p))
      .then((d) => {
        if (batal) return;
        setDetector(d);
        setStatus("ready");
      })
      .catch((e) => {
        if (batal) return;
        setError(String(e?.message ?? e));
        setStatus("error");
      });
    return () => {
      batal = true;
    };
  }, [cfg, attempt]);

  const retry = useCallback(() => {
    setStatus("loading");
    setError(null);
    setProgress(0);
    setAttempt((a) => a + 1);
  }, []);
  return { status, progress, detector, error, retry };
}

export function dukungan(): { kamera: boolean; wasm: boolean } {
  return {
    kamera: Boolean(navigator.mediaDevices?.getUserMedia) && window.isSecureContext,
    wasm: typeof WebAssembly !== "undefined",
  };
}
