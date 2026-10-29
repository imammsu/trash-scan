import { lazy, Suspense, useEffect, useState } from "react";
import { useConfig, useDetector } from "./lib/useApp";
import { track } from "./lib/analytics";
import { noticeSudahDilihat, src, tandaiNotice } from "./lib/state";
import type { Kelas } from "./lib/types";
import ScanScreen from "./screens/ScanScreen";
import KuisScreen from "./screens/KuisScreen";
import KamusScreen from "./screens/KamusScreen";
import TentangScreen from "./screens/TentangScreen";

const LokasiScreen = lazy(() => import("./screens/LokasiScreen"));

type Tab = "scan" | "kuis" | "kamus" | "lokasi" | "tentang";
const TABS: { id: Exclude<Tab, "tentang">; label: string }[] = [
  { id: "scan", label: "Scan" },
  { id: "kuis", label: "Kuis" },
  { id: "kamus", label: "Kamus" },
  { id: "lokasi", label: "Lokasi" },
];

export default function App() {
  const { cfg, error } = useConfig();
  const model = useDetector(cfg);
  const [tab, setTab] = useState<Tab>("scan");
  const [filterLokasi, setFilterLokasi] = useState<Kelas | null>(null);
  const [notice, setNotice] = useState(!noticeSudahDilihat());

  useEffect(() => {
    track("app_open", { src });
  }, []);

  function cariSetor(k: Kelas) {
    setFilterLokasi(k);
    setTab("lokasi");
  }

  if (error) {
    return (
      <main className="pesan pad">
        <h1>TrashScan</h1>
        <p>Konfigurasi aplikasi gagal dimuat: {error}</p>
        <button className="btn" onClick={() => location.reload()}>Muat ulang</button>
      </main>
    );
  }
  if (!cfg) return <p className="muted pad">Memuat...</p>;

  return (
    <div className="app">
      <header className="top">
        <div className="strip" aria-hidden="true">
          {cfg.kelas.map((k) => (
            <i key={k} style={{ background: cfg.kelasDetail[k].tong.warna }} />
          ))}
        </div>
        <div className="top-row">
          <h1>TrashScan</h1>
          <button className="link" onClick={() => setTab("tentang")} aria-current={tab === "tentang"}>Tentang</button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="note">
          <p>Aplikasi ini memakai analitik anonim. Foto yang kamu pindai tidak dikirim ke server.</p>
          <button className="btn ghost kecil" onClick={() => { tandaiNotice(); setNotice(false); }}>Mengerti</button>
        </div>
      )}

      <main>
        {/* Scan tetap terpasang agar model tidak dimuat ulang. Kamera berhenti saat unmount, jadi pasang hanya saat tab aktif. */}
        {tab === "scan" && <ScanScreen cfg={cfg} model={model} onCariSetor={cariSetor} onKuis={() => setTab("kuis")} />}
        {tab === "kuis" && <KuisScreen cfg={cfg} />}
        {tab === "kamus" && <KamusScreen cfg={cfg} onCariSetor={cariSetor} />}
        {tab === "lokasi" && (
          <Suspense fallback={<p className="muted pad">Memuat peta...</p>}>
            <LokasiScreen key={filterLokasi ?? "semua"} cfg={cfg} filterAwal={filterLokasi} />
          </Suspense>
        )}
        {tab === "tentang" && <TentangScreen cfg={cfg} />}
      </main>

      <nav className="bawah" aria-label="Navigasi utama">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "on" : ""}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => {
              if (t.id === "lokasi") setFilterLokasi(null);
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
