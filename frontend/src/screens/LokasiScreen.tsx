import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../components/Icon";
import { loadLokasi } from "../lib/content";
import { formatJarak, jarakMeter, linkRute } from "../lib/geo";
import { track } from "../lib/analytics";
import { namaPendek, varKelas } from "../lib/kelasUi";
import type { AppConfig, Kelas, Lokasi } from "../lib/types";

const WARNA_JENIS: Record<Lokasi["jenis"], string> = { bank_sampah: "#0F766E", b3: "#C62828", kompos: "#2E7D32" };
const NAMA_JENIS: Record<Lokasi["jenis"], string> = { bank_sampah: "Bank sampah", b3: "Titik B3", kompos: "Komposter" };
const IKON_JENIS: Record<Lokasi["jenis"], string> = { bank_sampah: "recycling", b3: "warning", kompos: "compost" };

interface Pos { lat: number; lng: number; akurasi: number }

function Terbang({ tujuan }: { tujuan: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (tujuan) map.flyTo(tujuan, Math.max(map.getZoom(), 16));
  }, [tujuan, map]);
  return null;
}

export default function LokasiScreen({ cfg, filterAwal }: { cfg: AppConfig; filterAwal: Kelas | null }) {
  const [data, setData] = useState<Lokasi[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Kelas | null>(filterAwal);
  const [pos, setPos] = useState<Pos | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [terbang, setTerbang] = useState<[number, number] | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    loadLokasi().then(setData).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    void (async () => {
      let izin = "tidak_diketahui";
      try {
        izin = (await navigator.permissions?.query({ name: "geolocation" }))?.state ?? izin;
      } catch {
        /* Safari lama */
      }
      track("lokasi_dibuka", { kelas: filterAwal ?? "semua", izin_lokasi: izin });
    })();
  }, [filterAwal]);

  useEffect(() => () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  }, [watchId]);

  function lokasiku() {
    if (!navigator.geolocation) {
      setGeoErr("Browser ini tidak mendukung lokasi.");
      return;
    }
    setGeoErr(null);
    if (watchId !== null) {
      if (pos) setTerbang([pos.lat, pos.lng]);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const baru = { lat: p.coords.latitude, lng: p.coords.longitude, akurasi: p.coords.accuracy };
        setPos((lama) => {
          if (!lama) setTerbang([baru.lat, baru.lng]);
          return baru;
        });
      },
      (e) => {
        setGeoErr(
          e.code === e.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Peta tetap tampil, tetapi daftar tidak terurut jarak."
            : "Lokasimu belum bisa ditentukan. Coba lagi di tempat terbuka.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    setWatchId(id);
  }

  const tampil = useMemo(() => {
    if (!data) return [];
    const f = filter ? data.filter((l) => l.menerima.includes(filter)) : data;
    const dgn = f.map((l) => ({ l, jarak: pos ? jarakMeter(pos.lat, pos.lng, l.lat, l.lng) : null }));
    if (pos) dgn.sort((a, b) => (a.jarak ?? 0) - (b.jarak ?? 0));
    return dgn;
  }, [data, filter, pos]);

  const kelasPunyaTitik = cfg.kelas.filter((k) => cfg.kelasDetail[k].titikSetor);
  const memakaiDataDemo = Boolean(data?.some((l) => l.statusData === "demo"));

  if (err) {
    return (
      <div className="card state-card err">
        <div className="badge-ikon"><Icon name="error" size={28} /></div>
        <h2>Data lokasi gagal dimuat</h2>
        <p>{err}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="judul-layar">
        <h2>Tempat setor</h2>
        <p className="muted">Temukan mitra bank sampah, komposter, dan titik B3 terdekat.</p>
      </div>

      {memakaiDataDemo && (
        <div className="alert info" role="note">
          <Icon name="science" size={20} />
          <span>Titik yang tampil masih <strong>data demo</strong>, bukan lokasi layanan terverifikasi. Ganti dengan data mitra sebelum aplikasi dipublikasikan.</span>
        </div>
      )}

      <div className="chips" role="group" aria-label="Filter kelas">
        <button className={"chip" + (!filter ? " on" : "")} aria-pressed={!filter} onClick={() => setFilter(null)}>
          Semua
        </button>
        {kelasPunyaTitik.map((k) => {
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

      <div className="peta">
        <MapContainer center={cfg.peta.pusat} zoom={cfg.peta.zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Terbang tujuan={terbang} />
          {tampil.map(({ l, jarak }) => (
            <CircleMarker key={l.id} center={[l.lat, l.lng]} radius={10} pathOptions={{ color: "#fff", weight: 2, fillColor: WARNA_JENIS[l.jenis], fillOpacity: 0.95 }}>
              <Popup>
                <strong>{l.nama}</strong>
                <br />{NAMA_JENIS[l.jenis]}. Menerima: {l.menerima.join(", ")}
                <br />Jam: {l.jam}
                {jarak !== null && <><br />Jarak: {formatJarak(jarak)}</>}
                <br /><a href={linkRute(l.lat, l.lng)} target="_blank" rel="noreferrer">Buka rute di Google Maps</a>
              </Popup>
            </CircleMarker>
          ))}
          {pos && (
            <>
              <Circle center={[pos.lat, pos.lng]} radius={pos.akurasi} pathOptions={{ color: "#1E63B5", weight: 1, fillOpacity: 0.12 }} />
              <CircleMarker center={[pos.lat, pos.lng]} radius={7} pathOptions={{ color: "#fff", weight: 2, fillColor: "#1E63B5", fillOpacity: 1 }} />
            </>
          )}
        </MapContainer>
        <button className="btn ghost kecil peta-fab" onClick={lokasiku}>
          <Icon name="my_location" size={18} />Ke lokasiku
        </button>
      </div>

      <div className="legenda" aria-label="Keterangan warna titik peta">
        <span><i style={{ background: WARNA_JENIS.bank_sampah }} />Bank sampah</span>
        <span><i style={{ background: WARNA_JENIS.b3 }} />Titik B3</span>
        <span><i style={{ background: WARNA_JENIS.kompos }} />Komposter</span>
      </div>

      {geoErr && (
        <div className="alert" role="alert">
          <Icon name="location_disabled" size={20} />
          <span>{geoErr}</span>
        </div>
      )}
      {pos && (
        <p className="catatan">
          <Icon name="shield_lock" size={16} />
          <span>Posisi dari GPS bisa meleset puluhan meter di dalam gedung. Lokasimu hanya diproses di browser.</span>
        </p>
      )}

      {data && tampil.length === 0 && (
        <p className="pesan-kosong">
          {data.length === 0
            ? "Data titik setor belum diisi untuk area ini. Tim akan menambahkannya bersama mitra."
            : "Belum ada titik setor untuk kelas ini."}
        </p>
      )}

      <ul className="daftar">
        {tampil.map(({ l, jarak }) => (
          <li key={l.id} className="card lega lok" style={{ "--j": WARNA_JENIS[l.jenis] } as CSSProperties}>
            <div className="lok-head">
              <div className="stack-sm">
                <span className="jenis-pil">
                  <Icon name={IKON_JENIS[l.jenis]} size={15} />
                  {NAMA_JENIS[l.jenis]}{l.statusData === "demo" ? " · Demo" : ""}
                </span>
                <h3>{l.nama}</h3>
              </div>
              {jarak !== null && <span className="jarak-pil">{formatJarak(jarak)}</span>}
            </div>

            <div className="info-baris">
              <Icon name="place" size={18} />
              <span>{l.alamat}</span>
            </div>
            <div className="info-baris">
              <Icon name="category" size={18} />
              <span>Menerima: {l.menerima.join(", ")}</span>
            </div>
            <div className="info-baris">
              <Icon name="schedule" size={18} />
              <span>Jam: {l.jam} · Kontak: {l.kontak}</span>
            </div>

            <div className="lok-foot">
              <span className="label-sm muted">Diperbarui {l.diperbarui}</span>
              <div className="row wrap">
                <button className="btn ghost kecil" onClick={() => setTerbang([l.lat, l.lng])}>
                  <Icon name="map" size={16} />Lihat di peta
                </button>
                <a className="btn kecil" href={linkRute(l.lat, l.lng)} target="_blank" rel="noreferrer">
                  <Icon name="directions" size={16} />Rute
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
