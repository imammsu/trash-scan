import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { loadKamus } from "../lib/content";
import { track } from "../lib/analytics";
import { IKON_KELAS, namaPendek, varKelas } from "../lib/kelasUi";
import type { AppConfig, KamusEntry, Kelas } from "../lib/types";

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export default function KamusScreen({ cfg, onCariSetor }: { cfg: AppConfig; onCariSetor: (k: Kelas) => void }) {
  const [data, setData] = useState<KamusEntry[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Kelas | null>(null);

  useEffect(() => {
    loadKamus().then(setData).catch((e) => setErr(e.message));
  }, []);

  const hasil = useMemo(() => {
    if (!data) return [];
    const n = norm(q);
    return data.filter((e) => {
      if (filter && e.kelas !== filter) return false;
      if (!n) return Boolean(filter);
      return [e.nama, ...e.alias].some((t) => norm(t).includes(n));
    });
  }, [data, q, filter]);

  // Analitik pencarian (debounce, tanpa mengirim istilah bila ditemukan)
  useEffect(() => {
    const n = norm(q);
    if (n.length < 3 || !data) return;
    const t = setTimeout(() => {
      const ada = hasil.length > 0;
      track("kamus_cari", ada ? { ditemukan: "ya" } : { ditemukan: "tidak", istilah: n.slice(0, 30) });
    }, 900);
    return () => clearTimeout(t);
  }, [q, hasil.length, data]);

  if (err) {
    return (
      <div className="card state-card err">
        <div className="badge-ikon"><Icon name="error" size={28} /></div>
        <h2>Kamus gagal dimuat</h2>
        <p>{err}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="judul-layar">
        <h2>Kamus Sampah</h2>
        <p className="muted">Ketik nama benda, atau pilih kelas untuk melihat daftarnya.</p>
      </div>

      <label className="cari">
        <span className="sr">Cari nama benda</span>
        <Icon name="search" size={22} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari benda, misalnya struk atau baterai"
        />
      </label>

      <div className="chips" role="group" aria-label="Filter kelas">
        {cfg.kelas.map((k) => {
          const on = filter === k;
          return (
            <button
              key={k}
              className={"chip kelas" + (on ? " on" : "")}
              style={varKelas(cfg, k)}
              aria-pressed={on}
              onClick={() => setFilter(on ? null : k)}
            >
              <span className="titik" aria-hidden="true" />
              <span>{namaPendek(cfg, k)}</span>
            </button>
          );
        })}
      </div>

      {!q && !filter && (
        <div className="pesan-kosong">
          Ketik nama benda di kotak pencarian, atau pilih salah satu kelas di atas untuk menelusuri kamus.
        </div>
      )}

      {(q || filter) && hasil.length === 0 && (
        <div className="card state-card warn">
          <div className="badge-ikon"><Icon name="search_off" size={28} /></div>
          <p>Belum ada "{q}" di kamus. Kami mencatat pencarian ini agar kamus bisa ditambah.</p>
        </div>
      )}

      <ul className="daftar">
        {hasil.map((e) => {
          const d = cfg.kelasDetail[e.kelas];
          return (
            <li key={e.nama} className="card lega entri" style={varKelas(cfg, e.kelas)}>
              <div className="entri-head">
                <div className="badge-ikon kelas">
                  <Icon name={IKON_KELAS[e.kelas]} size={22} fill />
                </div>
                <div className="grow stack-sm">
                  <h3>{e.nama}</h3>
                  <p className="tong"><i aria-hidden="true" />{d.nama} · {d.tong.label}</p>
                </div>
              </div>
              <p>{e.alasan}</p>
              <div className="tips">
                <Icon name="lightbulb" size={18} fill />
                <p><strong>Tips:</strong> {e.tips}</p>
              </div>
              {d.titikSetor && (
                <div>
                  <button className="btn tonal kecil" onClick={() => onCariSetor(e.kelas)}>
                    <Icon name="pin_drop" size={16} />Cari tempat setor
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
