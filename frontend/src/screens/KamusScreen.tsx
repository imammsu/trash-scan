import { useEffect, useMemo, useState } from "react";
import { loadKamus } from "../lib/content";
import { track } from "../lib/analytics";
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

  if (err) return <div className="pesan"><h2>Kamus gagal dimuat</h2><p>{err}</p></div>;

  return (
    <div className="kamus">
      <h2>Kamus Sampah</h2>
      <label className="cari">
        <span className="sr">Cari nama benda</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari benda, misalnya struk atau baterai" />
      </label>
      <div className="chips" role="group" aria-label="Filter kelas">
        {cfg.kelas.map((k) => (
          <button
            key={k}
            className={"chip" + (filter === k ? " on" : "")}
            style={filter === k ? { background: cfg.kelasDetail[k].tong.warna, color: k === "anorganik" ? "#1a1a1a" : "#fff" } : undefined}
            aria-pressed={filter === k}
            onClick={() => setFilter(filter === k ? null : k)}
          >
            {cfg.kelasDetail[k].nama.replace("Sampah ", "")}
          </button>
        ))}
      </div>

      {!q && !filter && <p className="muted">Ketik nama benda, atau pilih kelas untuk melihat daftarnya.</p>}
      {(q || filter) && hasil.length === 0 && (
        <p>Belum ada "{q}" di kamus. Kami mencatat pencarian ini agar kamus bisa ditambah.</p>
      )}

      <ul className="daftar">
        {hasil.map((e) => {
          const d = cfg.kelasDetail[e.kelas];
          return (
            <li key={e.nama} style={{ borderLeftColor: d.tong.warna }}>
              <h3>{e.nama}</h3>
              <p className="tong">{d.nama}. {d.tong.label}</p>
              <p>{e.alasan}</p>
              <p><strong>Tips:</strong> {e.tips}</p>
              {d.titikSetor && <button className="btn ghost kecil" onClick={() => onCariSetor(e.kelas)}>Cari tempat setor</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
