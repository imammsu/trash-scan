import { useEffect, useMemo, useState } from "react";
import { CircleAlert, MapPin, PackageSearch, Search } from "lucide-react";
import { loadKamus } from "../lib/content";
import { track } from "../lib/analytics";
import { IKON_KELAS, namaPendek, teksDi } from "../lib/kelasUi";
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

  useEffect(() => {
    const n = norm(q);
    if (n.length < 3 || !data) return;
    const t = setTimeout(() => {
      track("kamus_cari", hasil.length > 0 ? { ditemukan: "ya" } : { ditemukan: "tidak", istilah: n.slice(0, 30) });
    }, 900);
    return () => clearTimeout(t);
  }, [q, hasil.length, data]);

  if (err) return <div className="pesan"><span className="ikon-bulat"><CircleAlert size={30} aria-hidden="true" /></span><h2>Kamus gagal dimuat</h2><p>{err}</p></div>;

  return (
    <div className="kamus">
      <h2>Kamus Sampah</h2>
      <p className="muted">Bingung benda ini masuk mana? Cari namanya di sini.</p>
      <label className="cari">
        <span className="sr">Cari nama benda</span>
        <Search size={20} aria-hidden="true" />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari benda, misalnya struk atau baterai" />
      </label>
      <div className="chips" role="group" aria-label="Filter kelas">
        {cfg.kelas.map((k) => {
          const Ikon = IKON_KELAS[k];
          const w = cfg.kelasDetail[k].tong.warna;
          return (
            <button
              key={k}
              className="chip"
              style={filter === k ? { background: w, color: teksDi(w), borderColor: "transparent" } : undefined}
              aria-pressed={filter === k}
              onClick={() => setFilter(filter === k ? null : k)}
            >
              <Ikon size={16} aria-hidden="true" />
              {namaPendek(cfg.kelasDetail[k].nama)}
            </button>
          );
        })}
      </div>

      {!q && !filter && (
        <div className="pesan-kosong"><PackageSearch size={22} aria-hidden="true" /><p className="muted">Ketik nama benda, atau pilih satu kelas untuk melihat daftarnya.</p></div>
      )}
      {(q || filter) && hasil.length === 0 && (
        <div className="pesan-kosong"><PackageSearch size={22} aria-hidden="true" /><p>Belum ada "{q}" di kamus. Pencarian ini kami catat supaya kamus bisa ditambah.</p></div>
      )}

      <ul className="daftar">
        {hasil.map((e) => {
          const d = cfg.kelasDetail[e.kelas];
          const Ikon = IKON_KELAS[e.kelas];
          return (
            <li key={e.nama}>
              <div className="kepala">
                <span className="lencana" style={{ background: d.tong.warna, color: teksDi(d.tong.warna) }}><Ikon size={22} aria-hidden="true" /></span>
                <div>
                  <h3>{e.nama}</h3>
                  <p className="tong">{d.nama}</p>
                </div>
              </div>
              <p>{e.alasan}</p>
              <p className="muted"><strong>Tips:</strong> {e.tips}</p>
              <p className="catatan" style={{ margin: 0 }}>{d.tong.label}</p>
              {d.titikSetor && (
                <button className="btn soft kecil" style={{ marginTop: ".5rem" }} onClick={() => onCariSetor(e.kelas)}>
                  <MapPin size={16} aria-hidden="true" /> Cari tempat setor
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
