import { lazy, Suspense, useEffect, useState } from "react";
import { BookOpen, Download, Info, ListChecks, MapPin, ScanLine, ShieldCheck, type LucideIcon } from "lucide-react";
import { useConfig, useDetector } from "./lib/useApp";
import { track } from "./lib/analytics";
import { noticeSudahDilihat, src, tandaiNotice } from "./lib/state";
import { usePasang } from "./lib/pwa";
import type { Kelas } from "./lib/types";
import ScanScreen from "./screens/ScanScreen";
import KuisScreen from "./screens/KuisScreen";
import KamusScreen from "./screens/KamusScreen";
import TentangScreen from "./screens/TentangScreen";

const LokasiScreen = lazy(() => import("./screens/LokasiScreen"));

type Tab = "scan" | "kuis" | "kamus" | "lokasi" | "tentang";
const TABS: { id: Exclude<Tab, "tentang">; label: string; Ikon: LucideIcon }[] = [
  { id: "scan", label: "Scan", Ikon: ScanLine },
  { id: "kuis", label: "Kuis", Ikon: ListChecks },
  { id: "kamus", label: "Kamus", Ikon: BookOpen },
  { id: "lokasi", label: "Lokasi", Ikon: MapPin },
];

function Merek() {
  return (
    <div className="brand">
      <img src="/icons/icon-192.png" alt="" width={34} height={34} />
      <div>
        TrashScan
        <small>Pilah sampah, pelan-pelan jadi kebiasaan</small>
      </div>
    </div>
  );
}

export default function App() {
  const { cfg, error } = useConfig();
  const model = useDetector(cfg);
  const pwa = usePasang();
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
      <main className="pad">
        <div className="pesan">
          <h1>TrashScan</h1>
          <p>Konfigurasi aplikasi gagal dimuat: {error}</p>
          <button className="btn" onClick={() => location.reload()}>Muat ulang</button>
        </div>
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
          <Merek />
          <button className={"ikon-btn" + (tab === "tentang" ? " on" : "")} onClick={() => setTab("tentang")} aria-label="Tentang TrashScan">
            <Info size={22} aria-hidden="true" />
          </button>
        </div>
      </header>

      <aside className="rail">
        <Merek />
        <nav aria-label="Navigasi utama">
          {TABS.map(({ id, label, Ikon }) => (
            <button
              key={id}
              className={tab === id ? "on" : ""}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => {
                if (id === "lokasi") setFilterLokasi(null);
                setTab(id);
              }}
            >
              <span className="pil"><Ikon size={22} aria-hidden="true" /></span>
              {label}
            </button>
          ))}
        </nav>
        <div className="rail-bawah">
          {pwa.bisa && (
            <button className="btn soft kecil" onClick={pwa.pasang}>
              <Download size={18} aria-hidden="true" /> Pasang aplikasi
            </button>
          )}
          <button className={"btn ghost kecil"} onClick={() => setTab("tentang")}>
            <Info size={18} aria-hidden="true" /> Tentang
          </button>
        </div>
      </aside>

      <div>
        {notice && (
          <div className="notice" role="note">
            <p>
              <ShieldCheck size={20} aria-hidden="true" />
              Analitik anonim aktif. Foto yang kamu pindai tidak dikirim ke server.
            </p>
            <button className="btn ghost kecil" onClick={() => { tandaiNotice(); setNotice(false); }}>Mengerti</button>
          </div>
        )}
        <main>
          {tab === "scan" && <ScanScreen cfg={cfg} model={model} onCariSetor={cariSetor} onKuis={() => setTab("kuis")} />}
          {tab === "kuis" && <KuisScreen cfg={cfg} />}
          {tab === "kamus" && <KamusScreen cfg={cfg} onCariSetor={cariSetor} />}
          {tab === "lokasi" && (
            <Suspense fallback={<p className="muted pad">Memuat peta...</p>}>
              <LokasiScreen key={filterLokasi ?? "semua"} cfg={cfg} filterAwal={filterLokasi} />
            </Suspense>
          )}
          {tab === "tentang" && <TentangScreen cfg={cfg} pwa={pwa} />}
        </main>
      </div>
    </div>
  );
}
