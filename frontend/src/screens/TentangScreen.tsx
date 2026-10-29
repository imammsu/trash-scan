import Icon from "../components/Icon";
import type { AppConfig } from "../lib/types";

export default function TentangScreen({ cfg }: { cfg: AppConfig }) {
  return (
    <div className="stack">
      <section className="card lega tentang-sec hero-card">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="recycling" size={24} /></div>
          <div>
            <h2>Tentang TrashScan</h2>
            <span className="label-sm muted">Versi {cfg.versi}</span>
          </div>
        </div>
        <p>
          TrashScan membantu memilah sampah lewat kamera atau foto. Proyek ini bagian dari kampanye pemilahan sampah bersama mitra lokal untuk tugas Pendidikan dan Pembangunan Berkelanjutan.
        </p>
      </section>

      <section className="card lega tentang-sec">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="eco" size={22} fill /></div>
          <h3>SDGs yang disasar</h3>
        </div>
        <ul>
          <li>SDG 12 (utama): konsumsi dan produksi bertanggung jawab, target 12.5 tentang pengurangan sampah.</li>
          <li>SDG 4 (utama): pendidikan berkualitas, target 4.7 tentang pendidikan untuk pembangunan berkelanjutan.</li>
          <li>SDG 11, 13, dan 17 sebagai tujuan pendukung.</li>
        </ul>
      </section>

      <section className="card lega tentang-sec">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="psychology" size={22} /></div>
          <h3>Cara kerja</h3>
        </div>
        <p>
          Model YOLO11 berjalan langsung di browsermu. Gambar tidak dikirim ke server. Aplikasi hanya menampilkan panduan bila model cukup yakin.
        </p>
      </section>

      <section className="card lega tentang-sec">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="warning" size={22} /></div>
          <h3>Keterbatasan</h3>
        </div>
        <p>
          Model bisa keliru, terutama untuk benda yang jarang ada di data latih atau foto yang gelap dan buram. Untuk B3 dan benda yang meragukan, cek pedoman resmi atau tanya petugas bank sampah. Panduan dan lokasi diverifikasi bersama mitra lokal dan bisa berubah.
        </p>
      </section>

      <section className="card lega tentang-sec">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="shield_lock" size={22} /></div>
          <h3>Privasi</h3>
        </div>
        <ul>
          <li>Tidak perlu akun. Identitas teknis anonim dipakai hanya untuk kuis dan koreksi.</li>
          <li>Gambar hanya terkirim bila kamu menekan kirim pada koreksi, setelah persetujuan.</li>
          <li>Lokasimu hanya diproses di browser.</li>
          <li>Analitik anonim (jumlah buka aplikasi, hasil scan, penyelesaian kuis). Tidak ada data pribadi.</li>
        </ul>
      </section>

      <section className="card lega tentang-sec">
        <div className="card-head">
          <div className="badge-ikon"><Icon name="attribution" size={22} /></div>
          <h3>Atribusi dan lisensi</h3>
        </div>
        <ul>
          <li>Dataset: Roboflow Universe (workspace yolo-y9ms0, apaciapacu, dan dataset kaleng), CC BY 4.0. Cantumkan judul, pembuat, dan URL lengkap di laporan.</li>
          <li>Peta: data © OpenStreetMap contributors.</li>
          <li>Model dan library: Ultralytics YOLO11 (AGPL-3.0), ONNX Runtime Web, React, Vite, Firebase, Leaflet.</li>
          <li>Data statistik: SIPSN KLHK (dilaporkan GoodStats dan Republika).</li>
        </ul>
      </section>
    </div>
  );
}
