import { useEffect, useState } from "react";
import { loadConfig, type AppConfig } from "./lib/config.ts";
import { loadDetector, type Detector } from "./lib/detector.ts";
import { Scanner } from "./components/Scanner.tsx";
import { ErrorScreen, LoadingScreen, UnsupportedScreen } from "./components/Screens.tsx";

type State =
  | { phase: "loading"; loaded: number; total: number }
  | { phase: "error"; message: string }
  | { phase: "ready"; detector: Detector; config: AppConfig };

function unsupportedReasons(): string[] {
  const reasons: string[] = [];
  if (!navigator.mediaDevices?.getUserMedia) {
    reasons.push("Akses kamera (butuh alamat HTTPS)");
  }
  if (typeof WebAssembly !== "object") reasons.push("WebAssembly");
  return reasons;
}

export default function App() {
  const [reasons] = useState(unsupportedReasons);
  const [state, setState] = useState<State>({ phase: "loading", loaded: 0, total: 0 });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (reasons.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const config = await loadConfig();
        const modelUrl = `${import.meta.env.BASE_URL}${config.model.url}`;
        const detector = await loadDetector(modelUrl, config.model.inputSize, config.classes.length, (loaded, total) => {
          if (!cancelled) setState({ phase: "loading", loaded, total });
        });
        if (!cancelled) setState({ phase: "ready", detector, config });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setState({ phase: "error", message: "Model gagal dimuat. Periksa koneksi internetmu, lalu coba lagi." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, reasons]);

  if (reasons.length > 0) return <UnsupportedScreen reasons={reasons} />;

  switch (state.phase) {
    case "loading":
      return <LoadingScreen loaded={state.loaded} total={state.total} />;
    case "error":
      return (
        <ErrorScreen
          title="Gagal memuat"
          message={state.message}
          onRetry={() => {
            setState({ phase: "loading", loaded: 0, total: 0 });
            setAttempt((a) => a + 1);
          }}
        />
      );
    case "ready":
      return <Scanner detector={state.detector} config={state.config} />;
  }
}
