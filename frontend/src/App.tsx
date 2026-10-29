import { lazy, Suspense, useEffect, useState } from "react";
import { useConfig, useDetector } from "./lib/useApp";
import { track } from "./lib/analytics";
import { noticeSudahDilihat, src, tandaiNotice } from "./lib/state";
import type { Kelas } from "./lib/types";
import ScanScreen from "./screens/ScanScreen";
import KuisScreen from "./screens/KuisScreen";
import KamusScreen from "./screens/KamusScreen";
import TentangScreen from "./screens/TentangScreen";
import Icon from "./components/Icon";

const LokasiScreen = lazy(() => import("./screens/LokasiScreen"));

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida/AEtjO1UeXDlINJjG84omzvDHrZtNpyPDn-za0YOJRYTK03HYCsOXuCyebMN0qldfXeLFXcxPm2Uwur-LOeIVye86BCnCz9-OH_CijqhkxmrAx1NU7kaftz-tr74T5vs1uZ6P7q8wnQr2eB5k8Kf6j93djW9bqmdpupDFFF2rxUHbKIXcO9gMq7l4f16fKMnZQCbgO7kX6vkKp5BWPxFXShCa__WIrcWglAimtRgmR6TMR_qs";

type Tab = "scan" | "kuis" | "kamus" | "lokasi" | "tentang";
const TABS: { id: Exclude<Tab, "tentang">; label: string; icon: string }[] = [
  { id: "scan", label: "Scan", icon: "center_focus_strong" },
  { id: "kuis", label: "Kuis", icon: "quiz" },
  { id: "kamus", label: "Kamus", icon: "menu_book" },
  { id: "lokasi", label: "Lokasi", icon: "pin_drop" },
];
const SUBJUDUL: Record<Tab, string> = {
  scan: "Scan",
  kuis: "Kuis",
  kamus: "Kamus Sampah",
  lokasi: "Lokasi Setor",
  tentang: "Tentang",
};

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
      <main className="layar-muat">
        <div className="card state-card err">
          <div className="badge-ikon"><Icon name="cloud_off" size={28} /></div>
          <h2>TrashScan</h2>
          <p>Konfigurasi aplikasi gagal dimuat: {error}</p>
          <button className="btn" onClick={() => location.reload()}>
            <Icon name="refresh" />Muat ulang
          </button>
        </div>
      </main>
    );
  }
  if (!cfg) {
    return (
      <div className="layar-muat" role="status">
        <div className="stack-sm" style={{ alignItems: "center" }}>
          <img
            src={LOGO_URL}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/favicon.svg";
            }}
            alt="TrashScan Logo"
            width={48}
            height={48}
          />
          <p className="muted">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <div className="brand">
            <img
              src={LOGO_URL}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/favicon.svg";
              }}
              alt="TrashScan Logo"
            />
            <div className="brand-teks">
              <h1>TrashScan</h1>
              <span className="label-sm">{SUBJUDUL[tab]}</span>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => setTab("tentang")}
            aria-current={tab === "tentang"}
            aria-label="Tentang TrashScan"
          >
            <Icon name="info" size={22} />
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="note">
          <Icon name="shield_lock" size={22} />
          <p>Aplikasi ini memakai analitik anonim. Foto yang kamu pindai tidak dikirim ke server.</p>
          <button className="btn tonal kecil" onClick={() => { tandaiNotice(); setNotice(false); }}>Mengerti</button>
        </div>
      )}

      <main>
        {/* Scan tetap terpasang agar model tidak dimuat ulang. Kamera berhenti saat unmount, jadi pasang hanya saat tab aktif. */}
        {tab === "scan" && <ScanScreen cfg={cfg} model={model} onCariSetor={cariSetor} onKuis={() => setTab("kuis")} />}
        {tab === "kuis" && <KuisScreen cfg={cfg} />}
        {tab === "kamus" && <KamusScreen cfg={cfg} onCariSetor={cariSetor} />}
        {tab === "lokasi" && (
          <Suspense fallback={<p className="muted">Memuat peta...</p>}>
            <LokasiScreen key={filterLokasi ?? "semua"} cfg={cfg} filterAwal={filterLokasi} />
          </Suspense>
        )}
        {tab === "tentang" && <TentangScreen cfg={cfg} />}
      </main>

      <nav className="bawah" aria-label="Navigasi utama">
        <div className="bawah-inner">
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
              <Icon name={t.icon} size={20} fill={tab === t.id} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
